#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class RafflekTM360APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_token = None
        self.admin_token = None
        self.test_user_data = None
        self.test_raffle_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "status" in data and data["status"] == "healthy"
                self.log_test("Health Check", success, f"Response: {data}")
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_user_registration(self) -> bool:
        """Test user registration with age verification"""
        try:
            # Generate unique test user data
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.test_user_data = {
                "full_name": f"Test User {timestamp}",
                "email": f"testuser_{timestamp}@example.com",
                "phone": "9800000001",
                "password": "TestPass123!",
                "date_of_birth": "1990-01-01"  # 18+ years old
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=self.test_user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "user_id" in data
                if success:
                    self.test_user_data["user_id"] = data["user_id"]
                    self.log_test("User Registration", True, f"User registered with ID: {data['user_id']}")
                else:
                    self.log_test("User Registration", False, f"Registration failed: {data.get('message', 'Unknown error')}")
            else:
                try:
                    error_data = response.json()
                    self.log_test("User Registration", False, f"Status {response.status_code}: {error_data.get('detail', 'Unknown error')}")
                except:
                    self.log_test("User Registration", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_user_registration_age_validation(self) -> bool:
        """Test user registration age validation (under 18)"""
        try:
            # Test with user under 18
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            underage_user = {
                "full_name": f"Underage User {timestamp}",
                "email": f"underage_{timestamp}@example.com",
                "phone": "9800000002",
                "password": "TestPass123!",
                "date_of_birth": "2010-01-01"  # Under 18
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=underage_user,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should fail with 400 status code
            success = response.status_code == 400
            
            if success:
                data = response.json()
                success = "18 years or older" in data.get("detail", "")
                self.log_test("Age Validation (Under 18)", success, "Correctly rejected underage user")
            else:
                self.log_test("Age Validation (Under 18)", False, f"Expected 400, got {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Age Validation (Under 18)", False, str(e))
            return False

    def test_phone_validation(self) -> bool:
        """Test Nepali phone number validation"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            invalid_phone_user = {
                "full_name": f"Invalid Phone User {timestamp}",
                "email": f"invalidphone_{timestamp}@example.com",
                "phone": "123456789",  # Invalid phone format
                "password": "TestPass123!",
                "date_of_birth": "1990-01-01"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=invalid_phone_user,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should fail with 400 status code
            success = response.status_code == 400
            
            if success:
                data = response.json()
                success = "valid Nepali phone number" in data.get("detail", "")
                self.log_test("Phone Validation", success, "Correctly rejected invalid phone number")
            else:
                self.log_test("Phone Validation", False, f"Expected 400, got {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Phone Validation", False, str(e))
            return False

    def test_user_login_unverified(self) -> bool:
        """Test user login with unverified email (should fail)"""
        try:
            if not self.test_user_data:
                self.log_test("User Login (Unverified)", False, "No test user data available")
                return False
            
            login_data = {
                "email": self.test_user_data["email"],
                "password": self.test_user_data["password"]
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should fail with 401 status code (unverified email)
            success = response.status_code == 401
            
            if success:
                data = response.json()
                success = "verify your email" in data.get("detail", "")
                self.log_test("User Login (Unverified)", success, "Correctly rejected unverified user")
            else:
                self.log_test("User Login (Unverified)", False, f"Expected 401, got {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("User Login (Unverified)", False, str(e))
            return False

    def test_admin_login(self) -> bool:
        """Test admin login"""
        try:
            admin_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = requests.post(
                f"{self.base_url}/api/admin/login",
                json=admin_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "token" in data
                if success:
                    self.admin_token = data["token"]
                    self.log_test("Admin Login", True, "Admin logged in successfully")
                else:
                    self.log_test("Admin Login", False, f"Login failed: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Admin Login", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False

    def test_admin_verify(self) -> bool:
        """Test admin token verification"""
        try:
            if not self.admin_token:
                self.log_test("Admin Verify", False, "No admin token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/verify", headers=headers, timeout=10)
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and data.get("role") == "admin"
                self.log_test("Admin Verify", success, f"Admin verification: {data}")
            else:
                self.log_test("Admin Verify", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Admin Verify", False, str(e))
            return False

    def test_get_raffles(self) -> tuple[bool, list]:
        """Test get all raffles endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/raffles", timeout=10)
            success = response.status_code == 200
            
            if success:
                raffles = response.json()
                success = isinstance(raffles, list) and len(raffles) > 0
                
                if success:
                    # Validate raffle structure
                    required_fields = ['id', 'title', 'description', 'category', 'value', 'ticket_price', 'total_tickets', 'sold_tickets', 'draw_date']
                    first_raffle = raffles[0]
                    missing_fields = [field for field in required_fields if field not in first_raffle]
                    
                    if missing_fields:
                        success = False
                        self.log_test("Get All Raffles", False, f"Missing fields: {missing_fields}")
                    else:
                        self.test_raffle_id = first_raffle["id"]
                        self.log_test("Get All Raffles", True, f"Found {len(raffles)} raffles")
                else:
                    self.log_test("Get All Raffles", False, "Empty or invalid response")
                
                return success, raffles if success else []
            else:
                self.log_test("Get All Raffles", False, f"Status code: {response.status_code}")
                return False, []
                
        except Exception as e:
            self.log_test("Get All Raffles", False, str(e))
            return False, []

    def test_admin_raffle_management(self) -> bool:
        """Test admin raffle creation, update, and management"""
        try:
            if not self.admin_token:
                self.log_test("Admin Raffle Management", False, "No admin token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}", "Content-Type": "application/json"}
            
            # Test creating a new raffle
            new_raffle = {
                "title": "Test Raffle - Admin Created",
                "description": "This is a test raffle created by admin for testing purposes",
                "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
                "category": "Test",
                "value": 1000000,
                "ticket_price": 100,
                "total_tickets": 1000,
                "draw_date": (datetime.now() + timedelta(days=30)).isoformat(),
                "location": "Test Location"
            }
            
            response = requests.post(
                f"{self.base_url}/api/admin/raffles",
                json=new_raffle,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("success", False) and "raffle_id" in data
                if success:
                    created_raffle_id = data["raffle_id"]
                    self.log_test("Admin Raffle Management", True, f"Created raffle with ID: {created_raffle_id}")
                    
                    # Test updating the raffle
                    update_data = {"title": "Updated Test Raffle"}
                    update_response = requests.put(
                        f"{self.base_url}/api/admin/raffles/{created_raffle_id}",
                        json=update_data,
                        headers=headers,
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        self.log_test("Admin Raffle Update", True, "Raffle updated successfully")
                    else:
                        self.log_test("Admin Raffle Update", False, f"Update failed: {update_response.status_code}")
                    
                    return True
                else:
                    self.log_test("Admin Raffle Management", False, f"Creation failed: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Admin Raffle Management", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Admin Raffle Management", False, str(e))
            return False

    def test_admin_stats(self) -> bool:
        """Test admin statistics endpoint"""
        try:
            if not self.admin_token:
                self.log_test("Admin Stats", False, "No admin token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/api/admin/stats", headers=headers, timeout=10)
            
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                required_fields = ["total_raffles", "active_raffles", "total_users", "verified_users", "total_tickets_sold", "total_revenue"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if missing_fields:
                    success = False
                    self.log_test("Admin Stats", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Admin Stats", True, f"Stats retrieved: {len(stats)} fields")
            else:
                self.log_test("Admin Stats", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Admin Stats", False, str(e))
            return False

    def test_public_endpoints(self) -> bool:
        """Test public endpoints (stats, categories, winners)"""
        try:
            # Test public stats
            response = requests.get(f"{self.base_url}/api/stats", timeout=10)
            stats_success = response.status_code == 200
            
            # Test categories
            response = requests.get(f"{self.base_url}/api/categories", timeout=10)
            categories_success = response.status_code == 200
            
            # Test public winners
            response = requests.get(f"{self.base_url}/api/winners", timeout=10)
            winners_success = response.status_code == 200
            
            success = stats_success and categories_success and winners_success
            
            if success:
                self.log_test("Public Endpoints", True, "All public endpoints accessible")
            else:
                failed = []
                if not stats_success: failed.append("stats")
                if not categories_success: failed.append("categories")
                if not winners_success: failed.append("winners")
                self.log_test("Public Endpoints", False, f"Failed endpoints: {failed}")
            
            return success
        except Exception as e:
            self.log_test("Public Endpoints", False, str(e))
            return False

    def test_unauthorized_access(self) -> bool:
        """Test that protected endpoints require authentication"""
        try:
            # Test accessing user profile without token
            response = requests.get(f"{self.base_url}/api/auth/profile", timeout=10)
            profile_blocked = response.status_code == 401
            
            # Test accessing user tickets without token
            response = requests.get(f"{self.base_url}/api/user/tickets", timeout=10)
            tickets_blocked = response.status_code == 401
            
            # Test ticket purchase without token
            if self.test_raffle_id:
                purchase_data = {"raffle_id": self.test_raffle_id, "ticket_quantity": 1}
                response = requests.post(
                    f"{self.base_url}/api/tickets/purchase",
                    json=purchase_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                purchase_blocked = response.status_code == 401
            else:
                purchase_blocked = True  # Skip if no raffle ID
            
            # Test admin endpoints without token
            response = requests.get(f"{self.base_url}/api/admin/raffles", timeout=10)
            admin_blocked = response.status_code == 401
            
            success = profile_blocked and tickets_blocked and purchase_blocked and admin_blocked
            
            if success:
                self.log_test("Unauthorized Access Protection", True, "All protected endpoints properly secured")
            else:
                failed = []
                if not profile_blocked: failed.append("profile")
                if not tickets_blocked: failed.append("tickets")
                if not purchase_blocked: failed.append("purchase")
                if not admin_blocked: failed.append("admin")
                self.log_test("Unauthorized Access Protection", False, f"Unsecured endpoints: {failed}")
            
            return success
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, str(e))
            return False

    def run_all_tests(self) -> bool:
        """Run all comprehensive API tests"""
        print("🚀 Starting Comprehensive RafflekTM360 API Tests...")
        print(f"🔗 Testing API at: {self.base_url}")
        print("=" * 80)
        
        # Test 1: Health Check
        print("\n🏥 HEALTH & CONNECTIVITY TESTS")
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test 2: Public Endpoints
        print("\n🌐 PUBLIC ENDPOINTS TESTS")
        success, raffles = self.test_get_raffles()
        if not success or not raffles:
            print("❌ Failed to get raffles - stopping tests")
            return False
        
        self.test_public_endpoints()
        
        # Test 3: User Authentication System
        print("\n👤 USER AUTHENTICATION TESTS")
        self.test_user_registration()
        self.test_user_registration_age_validation()
        self.test_phone_validation()
        self.test_user_login_unverified()
        
        # Test 4: Admin Authentication System
        print("\n👨‍💼 ADMIN AUTHENTICATION TESTS")
        self.test_admin_login()
        self.test_admin_verify()
        
        # Test 5: Admin Management Features
        print("\n⚙️ ADMIN MANAGEMENT TESTS")
        self.test_admin_raffle_management()
        self.test_admin_stats()
        
        # Test 6: Security Tests
        print("\n🔒 SECURITY TESTS")
        self.test_unauthorized_access()
        
        # Print comprehensive summary
        print("\n" + "=" * 80)
        print(f"📊 COMPREHENSIVE TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 80)
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! API is fully functional and secure.")
            return True
        else:
            print("⚠️  SOME TESTS FAILED. Issues found:")
            failed_tests = [test for test in self.test_results if not test["success"]]
            
            # Group failures by category
            auth_failures = [t for t in failed_tests if "Auth" in t["name"] or "Login" in t["name"]]
            admin_failures = [t for t in failed_tests if "Admin" in t["name"]]
            security_failures = [t for t in failed_tests if "Security" in t["name"] or "Unauthorized" in t["name"]]
            other_failures = [t for t in failed_tests if t not in auth_failures + admin_failures + security_failures]
            
            if auth_failures:
                print(f"\n🔐 Authentication Issues ({len(auth_failures)}):")
                for test in auth_failures:
                    print(f"  - {test['name']}: {test['details']}")
            
            if admin_failures:
                print(f"\n👨‍💼 Admin System Issues ({len(admin_failures)}):")
                for test in admin_failures:
                    print(f"  - {test['name']}: {test['details']}")
            
            if security_failures:
                print(f"\n🔒 Security Issues ({len(security_failures)}):")
                for test in security_failures:
                    print(f"  - {test['name']}: {test['details']}")
            
            if other_failures:
                print(f"\n🔧 Other Issues ({len(other_failures)}):")
                for test in other_failures:
                    print(f"  - {test['name']}: {test['details']}")
            
            return False

def main():
    # Use the public endpoint from frontend/.env
    backend_url = "https://65673b09-749c-47ff-b761-9d28b7960cbf.preview.emergentagent.com"
    
    tester = RafflekTM360APITester(backend_url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())