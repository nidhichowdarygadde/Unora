#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime
from pymongo import MongoClient

class UnoraAPITester:
    def __init__(self):
        self.base_url = "https://meetup-maker-10.preview.emergentagent.com/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # MongoDB connection for test data setup
        self.mongo_client = MongoClient("mongodb://localhost:27017")
        self.db = self.mongo_client["test_database"]

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        try:
            timestamp = int(time.time())
            self.user_id = f"test-user-{timestamp}"
            self.session_token = f"test_session_{timestamp}"
            
            # Create test user
            user_doc = {
                "user_id": self.user_id,
                "email": f"test.user.{timestamp}@example.com",
                "name": "Test User",
                "picture": "https://via.placeholder.com/150",
                "created_at": datetime.utcnow()
            }
            self.db.users.insert_one(user_doc)
            
            # Create test session
            session_doc = {
                "user_id": self.user_id,
                "session_token": self.session_token,
                "expires_at": datetime.utcnow().replace(year=datetime.utcnow().year + 1),
                "created_at": datetime.utcnow()
            }
            self.db.user_sessions.insert_one(session_doc)
            
            print(f"🔧 Test user created: {self.user_id}")
            print(f"🔧 Session token: {self.session_token}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup test user: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        try:
            self.db.users.delete_many({"email": {"$regex": "test\\.user\\.*"}})
            self.db.user_sessions.delete_many({"session_token": {"$regex": "test_session"}})
            self.db.groups.delete_many({"creator_user_id": {"$regex": "test-user"}})
            print("🧹 Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {str(e)}")

    def make_request(self, method, endpoint, data=None, use_auth=True):
        """Make HTTP request with optional auth"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.Timeout:
            print(f"⏰ Request timeout for {endpoint}")
            return None
        except Exception as e:
            print(f"🔌 Connection error for {endpoint}: {str(e)}")
            return None

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            data = response.json()
            if data.get('user_id') == self.user_id:
                self.log_test("Auth /me endpoint", True)
                return True
            else:
                self.log_test("Auth /me endpoint", False, f"Wrong user_id: {data.get('user_id')}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Auth /me endpoint", False, f"Status: {status}")
        return False

    def test_auth_logout(self):
        """Test /auth/logout endpoint"""
        response = self.make_request('POST', 'auth/logout')
        if response and response.status_code == 200:
            self.log_test("Auth logout", True)
            return True
        else:
            status = response.status_code if response else "No response"
            self.log_test("Auth logout", False, f"Status: {status}")
        return False

    def test_create_group(self):
        """Test group creation"""
        group_data = {
            "name": "Test Weekend Group",
            "city": "San Francisco",
            "country": "United States",
            "member_names": ["Alice", "Bob", "Charlie"]
        }
        
        response = self.make_request('POST', 'groups', group_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get('group_id') and len(data.get('members', [])) == 3:
                self.log_test("Create group", True)
                return data['group_id']
            else:
                self.log_test("Create group", False, "Invalid response structure")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create group", False, f"Status: {status}")
        return None

    def test_group_size_validation(self):
        """Test group size validation (3-10 members)"""
        # Test too few members
        small_group = {
            "name": "Too Small",
            "city": "SF",
            "country": "United States",
            "member_names": ["Alice", "Bob"]
        }
        response = self.make_request('POST', 'groups', small_group)
        if response and response.status_code == 400:
            error_msg = response.json().get('detail', '')
            if "3-10 members" in error_msg:
                self.log_test("Group size validation (too few)", True)
            else:
                self.log_test("Group size validation (too few)", False, f"Wrong error: {error_msg}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Group size validation (too few)", False, f"Status: {status}")

        # Test too many members
        large_group = {
            "name": "Too Large",
            "city": "SF",
            "country": "United States", 
            "member_names": [f"Member{i}" for i in range(11)]
        }
        response = self.make_request('POST', 'groups', large_group)
        if response and response.status_code == 400:
            error_msg = response.json().get('detail', '')
            if "3-10 members" in error_msg:
                self.log_test("Group size validation (too many)", True)
            else:
                self.log_test("Group size validation (too many)", False, f"Wrong error: {error_msg}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Group size validation (too many)", False, f"Status: {status}")

    def test_get_groups(self):
        """Test getting user's groups"""
        response = self.make_request('GET', 'groups')
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get groups", True)
                return data
            else:
                self.log_test("Get groups", False, "Response not a list")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get groups", False, f"Status: {status}")
        return []

    def test_get_group_detail(self, group_id):
        """Test getting specific group details"""
        response = self.make_request('GET', f'groups/{group_id}')
        if response and response.status_code == 200:
            data = response.json()
            if data.get('group_id') == group_id:
                self.log_test("Get group detail", True)
                return data
            else:
                self.log_test("Get group detail", False, "Wrong group returned")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get group detail", False, f"Status: {status}")
        return None

    def test_update_member_preferences(self, group_id, member_id):
        """Test updating member preferences"""
        prefs_data = {
            "interests": ["Coffee & Cafes", "Parks & Nature"],
            "budget_min": 20,
            "budget_max": 80,
            "availability": {
                "Saturday": ["Morning", "Afternoon"],
                "Sunday": ["Afternoon"]
            }
        }
        
        response = self.make_request('PUT', f'groups/{group_id}/members/{member_id}/preferences', prefs_data)
        if response and response.status_code == 200:
            self.log_test("Update member preferences", True)
            return True
        else:
            status = response.status_code if response else "No response"
            self.log_test("Update member preferences", False, f"Status: {status}")
        return False

    def test_generate_plan_without_prefs(self, group_id):
        """Test plan generation without all preferences set"""
        response = self.make_request('POST', f'groups/{group_id}/generate-plan')
        if response and response.status_code == 400:
            error_msg = response.json().get('detail', '')
            if "preferences" in error_msg.lower():
                self.log_test("Generate plan (missing prefs)", True)
                return True
            else:
                self.log_test("Generate plan (missing prefs)", False, f"Wrong error: {error_msg}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Generate plan (missing prefs)", False, f"Status: {status}")
        return False

    def test_generate_plan_with_ai(self, group_id):
        """Test AI plan generation with GPT-5.2"""
        print("🤖 Testing AI plan generation (this may take 10-15 seconds)...")
        response = self.make_request('POST', f'groups/{group_id}/generate-plan')
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ['activity', 'location', 'suggested_time', 'explanation']
            if all(field in data for field in required_fields):
                self.log_test("AI plan generation", True)
                print(f"   Generated activity: {data['activity']}")
                return data
            else:
                self.log_test("AI plan generation", False, "Missing required fields")
        else:
            status = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', '')
                except:
                    pass
            self.log_test("AI plan generation", False, f"Status: {status}, Error: {error_msg}")
        return None

    def test_accept_plan(self, group_id):
        """Test accepting a plan"""
        response = self.make_request('POST', f'groups/{group_id}/accept-plan')
        if response and response.status_code == 200:
            self.log_test("Accept plan", True)
            return True
        else:
            status = response.status_code if response else "No response"
            self.log_test("Accept plan", False, f"Status: {status}")
        return False

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting Unora Backend API Tests")
        print("=" * 50)
        
        # Setup
        if not self.setup_test_user():
            return False
        
        try:
            # Auth tests
            print("\n📋 Testing Authentication...")
            self.test_auth_me()
            
            # Group management tests
            print("\n📋 Testing Group Management...")
            self.test_group_size_validation()
            group_id = self.test_create_group()
            
            if group_id:
                groups = self.test_get_groups()
                group_detail = self.test_get_group_detail(group_id)
                
                if group_detail and group_detail.get('members'):
                    # Member preferences tests
                    print("\n📋 Testing Member Preferences...")
                    member_id = group_detail['members'][0]['member_id']
                    
                    # Test plan generation without preferences
                    self.test_generate_plan_without_prefs(group_id)
                    
                    # Set preferences for all members
                    for member in group_detail['members']:
                        self.test_update_member_preferences(group_id, member['member_id'])
                    
                    # AI plan generation tests
                    print("\n📋 Testing AI Plan Generation...")
                    plan = self.test_generate_plan_with_ai(group_id)
                    
                    if plan:
                        self.test_accept_plan(group_id)
            
            # Auth logout test
            print("\n📋 Testing Logout...")
            self.test_auth_logout()
            
        finally:
            # Cleanup
            self.cleanup_test_data()
        
        # Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️ Some tests failed")
            return False

def main():
    tester = UnoraAPITester()
    success = tester.run_full_test_suite()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())