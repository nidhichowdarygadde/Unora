"""
Demo data for Unora showcase
This creates a realistic sample group with all features demonstrated
"""
from datetime import datetime, timezone

DEMO_GROUP_ID = "demo_group_showcase"
DEMO_MOMENT_ID = "demo_moment_showcase"

DEMO_GROUP = {
    "group_id": DEMO_GROUP_ID,
    "name": "Weekend Squad",
    "city": "San Francisco",
    "country": "United States",
    "creator_user_id": "demo_user_creator",
    "is_demo": True,
    "members": [
        {
            "member_id": "demo_member_1",
            "member_token": "demo_permanent_token_1",
            "member_user_id": "demo_user_1",
            "name": "Alex",
            "interests": ["Outdoor Activities", "Parks & Nature", "Coffee & Cafes"],
            "budget_min": 20,
            "budget_max": 60,
            "availability": {
                "Saturday": ["Morning", "Afternoon"],
                "Sunday": ["Afternoon", "Evening"]
            },
            "has_set_preferences": True
        },
        {
            "member_id": "demo_member_2",
            "member_token": "demo_permanent_token_2",
            "member_user_id": "demo_user_2",
            "name": "Jordan",
            "interests": ["Restaurants", "Museums & Art", "Music & Concerts"],
            "budget_min": 30,
            "budget_max": 80,
            "availability": {
                "Saturday": ["Afternoon", "Evening"],
                "Sunday": ["Morning", "Afternoon"]
            },
            "has_set_preferences": True
        },
        {
            "member_id": "demo_member_3",
            "member_token": "demo_permanent_token_3",
            "member_user_id": "demo_user_3",
            "name": "Sam",
            "interests": ["Sports & Fitness", "Outdoor Activities", "Games & Arcades"],
            "budget_min": 15,
            "budget_max": 50,
            "availability": {
                "Saturday": ["Morning", "Afternoon"],
                "Sunday": ["Afternoon"]
            },
            "has_set_preferences": True
        },
        {
            "member_id": "demo_member_4",
            "member_token": "demo_permanent_token_4",
            "member_user_id": "demo_user_4",
            "name": "Riley",
            "interests": ["Coffee & Cafes", "Shopping", "Movies & Theater"],
            "budget_min": 25,
            "budget_max": 70,
            "availability": {
                "Saturday": ["Afternoon"],
                "Sunday": ["Morning", "Afternoon", "Evening"]
            },
            "has_set_preferences": True
        },
        {
            "member_id": "demo_join_member",
            "member_token": "permanent_demo_invite_token_unora",
            "member_user_id": None,
            "name": "New Member",
            "interests": [],
            "budget_min": 0,
            "budget_max": 100,
            "availability": {},
            "has_set_preferences": False
        }
    ],
    "current_plan": {
        "activity": "Golden Gate Park Picnic & Botanical Garden Stroll",
        "location": "Golden Gate Park, San Francisco, CA",
        "suggested_time": "Saturday afternoon, 2-5pm",
        "explanation": "This plan balances everyone's love for outdoor activities with the group's budget range ($15-$80). Saturday afternoon works for all four members, and Golden Gate Park offers free entry with optional paid botanical garden access. The casual setting encourages conversation and connection without pressure.",
        "status": "completed",
        "generated_at": datetime(2025, 1, 25, 14, 30, 0, tzinfo=timezone.utc),
        "accepted_at": datetime(2025, 1, 25, 15, 0, 0, tzinfo=timezone.utc),
        "completed_at": datetime(2025, 1, 27, 18, 0, 0, tzinfo=timezone.utc)
    },
    "created_at": datetime(2025, 1, 20, 10, 0, 0, tzinfo=timezone.utc)
}

DEMO_MOMENT = {
    "moment_id": DEMO_MOMENT_ID,
    "group_id": DEMO_GROUP_ID,
    "plan_data": {
        "activity": "Golden Gate Park Picnic & Botanical Garden Stroll",
        "location": "Golden Gate Park, San Francisco, CA",
        "suggested_time": "Saturday afternoon, 2-5pm",
        "explanation": "This plan balances everyone's love for outdoor activities with the group's budget range ($15-$80). Saturday afternoon works for all four members, and Golden Gate Park offers free entry with optional paid botanical garden access.",
        "status": "completed",
        "completed_at": datetime(2025, 1, 27, 18, 0, 0, tzinfo=timezone.utc)
    },
    "media": [
        {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            "filename": "park_view.jpg",
            "uploaded_at": datetime(2025, 1, 27, 18, 30, 0, tzinfo=timezone.utc)
        },
        {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
            "filename": "group_photo.jpg",
            "uploaded_at": datetime(2025, 1, 27, 18, 35, 0, tzinfo=timezone.utc)
        },
        {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&q=80",
            "filename": "botanical_gardens.jpg",
            "uploaded_at": datetime(2025, 1, 27, 19, 0, 0, tzinfo=timezone.utc)
        }
    ],
    "caption": "Perfect afternoon at Golden Gate Park! The weather was beautiful, and we spent hours exploring the botanical gardens and sharing stories over our picnic. Already planning the next one!",
    "created_at": datetime(2025, 1, 27, 18, 0, 0, tzinfo=timezone.utc)
}

# Permanent demo invite link token
DEMO_INVITE_TOKEN = "permanent_demo_invite_token_unora"
DEMO_JOIN_MEMBER = {
    "member_id": "demo_join_member",
    "member_token": DEMO_INVITE_TOKEN,
    "member_user_id": None,
    "name": "New Member",
    "interests": [],
    "budget_min": 0,
    "budget_max": 100,
    "availability": {},
    "has_set_preferences": False
}
