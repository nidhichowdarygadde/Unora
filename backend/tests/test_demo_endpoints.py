"""
Test Demo Endpoints for Unora App
Tests the demo group, moments, invite-token, and invite link endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Demo data constants
DEMO_GROUP_ID = "demo_group_showcase"
DEMO_INVITE_TOKEN = "permanent_demo_invite_token_unora"


class TestDemoEndpoints:
    """Test public demo endpoints (no auth required)"""

    def test_demo_group_returns_200(self):
        """GET /api/demo/group should return 200 with demo group data"""
        response = requests.get(f"{BASE_URL}/api/demo/group")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "group_id" in data, "Response should contain group_id"
        assert data["group_id"] == DEMO_GROUP_ID, f"Expected group_id {DEMO_GROUP_ID}, got {data['group_id']}"
        assert "name" in data, "Response should contain name"
        assert "city" in data, "Response should contain city"
        assert "country" in data, "Response should contain country"
        assert "members" in data, "Response should contain members"
        print(f"✓ Demo group returned: {data['name']} in {data['city']}, {data['country']}")

    def test_demo_group_has_5_members(self):
        """GET /api/demo/group should return group with 5 members"""
        response = requests.get(f"{BASE_URL}/api/demo/group")
        assert response.status_code == 200
        
        data = response.json()
        members = data.get("members", [])
        assert len(members) == 5, f"Expected 5 members, got {len(members)}"
        
        # Verify member structure
        for member in members:
            assert "member_id" in member, "Each member should have member_id"
            assert "name" in member, "Each member should have name"
            assert "member_token" in member, "Each member should have member_token"
        
        member_names = [m["name"] for m in members]
        print(f"✓ Demo group has 5 members: {', '.join(member_names)}")

    def test_demo_group_has_current_plan(self):
        """GET /api/demo/group should return group with current_plan"""
        response = requests.get(f"{BASE_URL}/api/demo/group")
        assert response.status_code == 200
        
        data = response.json()
        current_plan = data.get("current_plan")
        assert current_plan is not None, "Demo group should have current_plan"
        assert "activity" in current_plan, "Plan should have activity"
        assert "location" in current_plan, "Plan should have location"
        assert "suggested_time" in current_plan, "Plan should have suggested_time"
        assert "explanation" in current_plan, "Plan should have explanation"
        print(f"✓ Demo group has plan: {current_plan['activity']}")

    def test_demo_moments_returns_200(self):
        """GET /api/demo/moments should return 200 with demo moments"""
        response = requests.get(f"{BASE_URL}/api/demo/moments")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one moment"
        
        moment = data[0]
        assert "moment_id" in moment, "Moment should have moment_id"
        assert "group_id" in moment, "Moment should have group_id"
        assert "plan_data" in moment, "Moment should have plan_data"
        print(f"✓ Demo moments returned: {len(data)} moment(s)")

    def test_demo_invite_token_returns_200(self):
        """GET /api/demo/invite-token should return correct token"""
        response = requests.get(f"{BASE_URL}/api/demo/invite-token")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "invite_token" in data, "Response should contain invite_token"
        assert "group_id" in data, "Response should contain group_id"
        assert data["invite_token"] == DEMO_INVITE_TOKEN, f"Expected token {DEMO_INVITE_TOKEN}, got {data['invite_token']}"
        assert data["group_id"] == DEMO_GROUP_ID, f"Expected group_id {DEMO_GROUP_ID}, got {data['group_id']}"
        print(f"✓ Demo invite token returned: {data['invite_token']}")


class TestInviteEndpoint:
    """Test invite endpoint - the main bug fix being verified"""

    def test_invite_endpoint_returns_200_with_valid_token(self):
        """GET /api/invite/{group_id}/{member_token} should return 200 with valid demo token"""
        response = requests.get(f"{BASE_URL}/api/invite/{DEMO_GROUP_ID}/{DEMO_INVITE_TOKEN}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "group_name" in data, "Response should contain group_name"
        assert "group_city" in data, "Response should contain group_city"
        assert "group_country" in data, "Response should contain group_country"
        assert "member" in data, "Response should contain member"
        
        # Verify member data
        member = data["member"]
        assert member["member_token"] == DEMO_INVITE_TOKEN, "Member token should match"
        print(f"✓ Invite endpoint returned: {data['group_name']} in {data['group_city']}, {data['group_country']}")

    def test_invite_endpoint_returns_404_with_invalid_group(self):
        """GET /api/invite/{invalid_group_id}/{token} should return 404"""
        response = requests.get(f"{BASE_URL}/api/invite/fake_group_id_12345/{DEMO_INVITE_TOKEN}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"✓ Invalid group returns 404: {data['detail']}")

    def test_invite_endpoint_returns_404_with_invalid_token(self):
        """GET /api/invite/{group_id}/{invalid_token} should return 404"""
        response = requests.get(f"{BASE_URL}/api/invite/{DEMO_GROUP_ID}/fake_token_12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"✓ Invalid token returns 404: {data['detail']}")


class TestHealthAndBasicEndpoints:
    """Test basic API health"""

    def test_api_is_accessible(self):
        """Basic connectivity test"""
        response = requests.get(f"{BASE_URL}/api/demo/group", timeout=10)
        assert response.status_code in [200, 404, 500], f"API should be accessible, got {response.status_code}"
        print(f"✓ API is accessible at {BASE_URL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
