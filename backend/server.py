from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def migrate_existing_groups():
    """Add member_token to existing members that don't have one, and country field"""
    try:
        groups = await db.groups.find({}, {"_id": 0}).to_list(1000)
        for group in groups:
            updated = False
            
            # Add member_token if missing
            for member in group.get("members", []):
                if "member_token" not in member or not member["member_token"]:
                    member["member_token"] = uuid.uuid4().hex
                    updated = True
            
            # Add country field if missing
            if "country" not in group or not group["country"]:
                group["country"] = "United States"
                updated = True
            
            if updated:
                await db.groups.update_one(
                    {"group_id": group["group_id"]},
                    {"$set": {"members": group["members"], "country": group.get("country", "United States")}}
                )
                logger.info(f"Migrated group {group['group_id']}")
    except Exception as e:
        logger.error(f"Migration error: {e}")


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime


class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    member_id: str
    member_token: Optional[str] = None
    name: str
    interests: List[str] = []
    budget_min: int = 0
    budget_max: int = 100
    availability: dict = Field(default_factory=dict)
    has_set_preferences: bool = False


class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    group_id: str
    name: str
    city: str
    country: str
    creator_user_id: str
    members: List[Member] = []
    current_plan: Optional[dict] = None
    created_at: datetime


class GroupCreate(BaseModel):
    name: str
    city: str
    country: str
    member_names: List[str]


class MemberPreferences(BaseModel):
    interests: List[str]
    budget_min: int
    budget_max: int
    availability: dict


class Plan(BaseModel):
    activity: str
    location: str
    suggested_time: str
    explanation: str


class Moment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    moment_id: str
    group_id: str
    plan_data: dict
    media: List[dict] = []
    caption: Optional[str] = None
    created_at: datetime


class MomentCreate(BaseModel):
    media: List[dict] = []
    caption: Optional[str] = None


async def get_session_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_doc


@api_router.post("/auth/session")
async def process_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            session_data = await resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": session_data["name"],
                "picture": session_data.get("picture")
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    
    session_token = session_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user_data,
        "session_token": session_token
    }


@api_router.get("/auth/me")
async def get_current_user(request: Request):
    user = await get_session_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}


@api_router.post("/groups", response_model=Group)
async def create_group(group_data: GroupCreate, request: Request):
    user = await get_session_user(request)
    
    if len(group_data.member_names) < 3 or len(group_data.member_names) > 10:
        raise HTTPException(status_code=400, detail="Groups must have 3-10 members")
    
    group_id = f"group_{uuid.uuid4().hex[:12]}"
    members = []
    for name in group_data.member_names:
        member = Member(
            member_id=f"member_{uuid.uuid4().hex[:12]}",
            member_token=uuid.uuid4().hex,
            name=name.strip(),
            interests=[],
            budget_min=0,
            budget_max=100,
            availability={},
            has_set_preferences=False
        )
        members.append(member)
    
    group = Group(
        group_id=group_id,
        name=group_data.name,
        city=group_data.city,
        country=group_data.country,
        creator_user_id=user["user_id"],
        members=members,
        current_plan=None,
        created_at=datetime.now(timezone.utc)
    )
    
    group_dict = group.model_dump()
    group_dict["created_at"] = group_dict["created_at"].isoformat()
    
    await db.groups.insert_one(group_dict)
    return group


@api_router.get("/groups", response_model=List[Group])
async def get_groups(request: Request):
    user = await get_session_user(request)
    groups = await db.groups.find({"creator_user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    
    for group in groups:
        if isinstance(group["created_at"], str):
            group["created_at"] = datetime.fromisoformat(group["created_at"])
    
    return groups


@api_router.get("/groups/{group_id}", response_model=Group)
async def get_group(group_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if isinstance(group["created_at"], str):
        group["created_at"] = datetime.fromisoformat(group["created_at"])
    
    return group


@api_router.put("/groups/{group_id}/members/{member_id}/preferences")
async def update_member_preferences(group_id: str, member_id: str, prefs: MemberPreferences, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members = group["members"]
    member_found = False
    for member in members:
        if member["member_id"] == member_id:
            member["interests"] = prefs.interests
            member["budget_min"] = prefs.budget_min
            member["budget_max"] = prefs.budget_max
            member["availability"] = prefs.availability
            member["has_set_preferences"] = True
            member_found = True
            break
    
    if not member_found:
        raise HTTPException(status_code=404, detail="Member not found")
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$set": {"members": members}}
    )
    
    return {"message": "Preferences updated"}


@api_router.get("/invite/{group_id}/{member_token}")
async def get_invite_info(group_id: str, member_token: str):
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    
    member = None
    for m in group["members"]:
        if m["member_token"] == member_token:
            member = m
            break
    
    if not member:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    
    return {
        "group_name": group["name"],
        "group_city": group["city"],
        "group_country": group["country"],
        "member": member
    }


@api_router.put("/invite/{group_id}/{member_token}/preferences")
async def update_member_preferences_via_invite(group_id: str, member_token: str, prefs: MemberPreferences):
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    
    members = group["members"]
    member_found = False
    for member in members:
        if member["member_token"] == member_token:
            member["interests"] = prefs.interests
            member["budget_min"] = prefs.budget_min
            member["budget_max"] = prefs.budget_max
            member["availability"] = prefs.availability
            member["has_set_preferences"] = True
            member_found = True
            break
    
    if not member_found:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$set": {"members": members}}
    )
    
    return {"message": "Preferences updated"}


@api_router.post("/groups/{group_id}/generate-plan", response_model=Plan)
async def generate_plan(group_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members_with_prefs = [m for m in group["members"] if m["has_set_preferences"]]
    if len(members_with_prefs) < len(group["members"]):
        raise HTTPException(status_code=400, detail="All members must set preferences first")
    
    all_interests = []
    budget_ranges = []
    availabilities = []
    
    for member in group["members"]:
        all_interests.extend(member["interests"])
        budget_ranges.append((member["budget_min"], member["budget_max"]))
        availabilities.append(member["availability"])
    
    common_interests = list(set(all_interests))
    avg_budget_min = sum(b[0] for b in budget_ranges) // len(budget_ranges)
    avg_budget_max = sum(b[1] for b in budget_ranges) // len(budget_ranges)
    
    prompt = f"""You are a thoughtful group activity planner for Unora, an app that helps friends meet offline.

Group: {group['name']}
Location: {group['city']}, {group['country']}
Number of members: {len(group['members'])}

Member interests: {', '.join(common_interests)}
Budget range: ${avg_budget_min}-${avg_budget_max}

Availability summary:
{json.dumps(availabilities, indent=2)}

Please suggest ONE balanced activity that:
1. Works within {group['city']}, {group['country']} and the budget
2. Appeals to the group's interests
3. Fits their overlapping availability (or the fairest compromise)
4. Is calm, non-commercial, and encourages real connection

Respond ONLY in this JSON format:
{{
  "activity": "Activity name",
  "location": "Specific place or area in {group['city']}, {group['country']}",
  "suggested_time": "Best time window (e.g., 'Saturday afternoon, 2-4pm')",
  "explanation": "2-3 sentences explaining why this works for the group, mentioning how preferences and availability were balanced"
}}"""
    
    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"plan_{group_id}_{uuid.uuid4().hex[:8]}",
            system_message="You are a helpful assistant that responds only with valid JSON."
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        plan_data = json.loads(response)
        plan = Plan(**plan_data)
        
        plan_dict = plan.model_dump()
        plan_dict["status"] = "generated"
        plan_dict["generated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.groups.update_one(
            {"group_id": group_id},
            {"$set": {"current_plan": plan_dict}}
        )
        
        return plan
    except Exception as e:
        logger.error(f"Error generating plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")


@api_router.post("/groups/{group_id}/accept-plan")
async def accept_plan(group_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if not group.get("current_plan"):
        raise HTTPException(status_code=400, detail="No plan to accept")
    
    plan_with_status = {
        **group["current_plan"],
        "status": "accepted",
        "accepted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$set": {"current_plan": plan_with_status}}
    )
    
    return {"message": "Plan accepted", "plan": plan_with_status}


@api_router.post("/groups/{group_id}/complete-plan")
async def complete_plan(group_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    current_plan = group.get("current_plan")
    if not current_plan or current_plan.get("status") != "accepted":
        raise HTTPException(status_code=400, detail="No accepted plan to complete")
    
    plan_with_status = {
        **current_plan,
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$set": {"current_plan": plan_with_status}}
    )
    
    moment_id = f"moment_{uuid.uuid4().hex[:12]}"
    moment = Moment(
        moment_id=moment_id,
        group_id=group_id,
        plan_data=plan_with_status,
        media=[],
        caption=None,
        created_at=datetime.now(timezone.utc)
    )
    
    moment_dict = moment.model_dump()
    moment_dict["created_at"] = moment_dict["created_at"].isoformat()
    await db.moments.insert_one(moment_dict)
    
    return {"message": "Plan completed", "moment_id": moment_id}


@api_router.get("/groups/{group_id}/moments")
async def get_moments(group_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    moments = await db.moments.find({"group_id": group_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for moment in moments:
        if isinstance(moment["created_at"], str):
            moment["created_at"] = datetime.fromisoformat(moment["created_at"])
    
    return moments


@api_router.post("/groups/{group_id}/moments/{moment_id}/media")
async def add_moment_media(group_id: str, moment_id: str, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    data = await request.json()
    media_item = data.get("media_item")
    caption = data.get("caption")
    
    moment = await db.moments.find_one({"moment_id": moment_id, "group_id": group_id}, {"_id": 0})
    if not moment:
        raise HTTPException(status_code=404, detail="Moment not found")
    
    media_list = moment.get("media", [])
    if media_item:
        media_list.append(media_item)
    
    update_data = {"media": media_list}
    if caption is not None:
        update_data["caption"] = caption
    
    await db.moments.update_one(
        {"moment_id": moment_id},
        {"$set": update_data}
    )
    
    return {"message": "Media added to moment"}


@api_router.delete("/groups/{group_id}/moments/{moment_id}/media/{media_index}")
async def delete_moment_media(group_id: str, moment_id: str, media_index: int, request: Request):
    user = await get_session_user(request)
    group = await db.groups.find_one({"group_id": group_id, "creator_user_id": user["user_id"]}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    moment = await db.moments.find_one({"moment_id": moment_id, "group_id": group_id}, {"_id": 0})
    if not moment:
        raise HTTPException(status_code=404, detail="Moment not found")
    
    media_list = moment.get("media", [])
    if media_index < 0 or media_index >= len(media_list):
        raise HTTPException(status_code=400, detail="Invalid media index")
    
    media_list.pop(media_index)
    
    await db.moments.update_one(
        {"moment_id": moment_id},
        {"$set": {"media": media_list}}
    )
    
    return {"message": "Media deleted"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
