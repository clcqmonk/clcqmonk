#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class RaffleAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def test_get_raffles_by_category(self, category: str) -> bool:
        """Test get raffles filtered by category"""
        try:
            response = requests.get(f"{self.base_url}/api/raffles?category={category}", timeout=10)
            success = response.status_code == 200
            
            if success:
                raffles = response.json()
                success = isinstance(raffles, list)
                
                if success and raffles:
                    # Verify all raffles match the category
                    wrong_category = [r for r in raffles if r.get('category') != category]
                    if wrong_category:
                        success = False
                        self.log_test(f"Get Raffles by Category ({category})", False, f"Found {len(wrong_category)} raffles with wrong category")
                    else:
                        self.log_test(f"Get Raffles by Category ({category})", True, f"Found {len(raffles)} {category} raffles")
                else:
                    self.log_test(f"Get Raffles by Category ({category})", True, f"No {category} raffles found")
            else:
                self.log_test(f"Get Raffles by Category ({category})", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test(f"Get Raffles by Category ({category})", False, str(e))
            return False

    def test_get_raffle_by_id(self, raffle_id: str) -> bool:
        """Test get specific raffle by ID"""
        try:
            response = requests.get(f"{self.base_url}/api/raffles/{raffle_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                raffle = response.json()
                success = isinstance(raffle, dict) and raffle.get('id') == raffle_id
                self.log_test("Get Raffle by ID", success, f"Retrieved raffle: {raffle.get('title', 'Unknown')}")
            else:
                self.log_test("Get Raffle by ID", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Get Raffle by ID", False, str(e))
            return False

    def test_get_categories(self) -> bool:
        """Test get categories endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/categories", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "categories" in data and isinstance(data["categories"], list)
                
                if success:
                    categories = data["categories"]
                    expected_categories = ["House", "Car", "Land"]
                    missing_categories = [cat for cat in expected_categories if cat not in categories]
                    
                    if missing_categories:
                        self.log_test("Get Categories", False, f"Missing categories: {missing_categories}")
                        success = False
                    else:
                        self.log_test("Get Categories", True, f"Categories: {categories}")
                else:
                    self.log_test("Get Categories", False, "Invalid response format")
            else:
                self.log_test("Get Categories", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Get Categories", False, str(e))
            return False

    def test_get_stats(self) -> bool:
        """Test get stats endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/stats", timeout=10)
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                required_fields = ["total_raffles", "total_participants", "total_prize_value"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if missing_fields:
                    success = False
                    self.log_test("Get Stats", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Get Stats", True, f"Stats: {stats}")
            else:
                self.log_test("Get Stats", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Get Stats", False, str(e))
            return False

    def test_purchase_tickets(self, raffle_id: str) -> bool:
        """Test ticket purchase endpoint"""
        try:
            purchase_data = {
                "raffle_id": raffle_id,
                "user_name": "Test User",
                "user_email": "test@example.com",
                "user_phone": "+977-9800000000",
                "ticket_quantity": 2,
                "total_amount": 1000.0
            }
            
            response = requests.post(
                f"{self.base_url}/api/tickets/purchase",
                json=purchase_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                result = response.json()
                required_fields = ["success", "message", "ticket_ids", "purchase_id"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    success = False
                    self.log_test("Purchase Tickets", False, f"Missing fields: {missing_fields}")
                elif not result.get("success"):
                    success = False
                    self.log_test("Purchase Tickets", False, f"Purchase failed: {result.get('message')}")
                else:
                    ticket_ids = result.get("ticket_ids", [])
                    if len(ticket_ids) != purchase_data["ticket_quantity"]:
                        success = False
                        self.log_test("Purchase Tickets", False, f"Expected {purchase_data['ticket_quantity']} tickets, got {len(ticket_ids)}")
                    else:
                        self.log_test("Purchase Tickets", True, f"Purchased {len(ticket_ids)} tickets successfully")
            else:
                self.log_test("Purchase Tickets", False, f"Status code: {response.status_code}")
            
            return success
        except Exception as e:
            self.log_test("Purchase Tickets", False, str(e))
            return False

    def run_all_tests(self) -> bool:
        """Run all API tests"""
        print("🚀 Starting RafflekTM360 API Tests...")
        print(f"🔗 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test 2: Get all raffles
        success, raffles = self.test_get_raffles()
        if not success or not raffles:
            print("❌ Failed to get raffles - stopping tests")
            return False
        
        # Test 3: Get raffles by category
        categories = ["House", "Car", "Land"]
        for category in categories:
            self.test_get_raffles_by_category(category)
        
        # Test 4: Get specific raffle by ID
        test_raffle_id = raffles[0]["id"]
        self.test_get_raffle_by_id(test_raffle_id)
        
        # Test 5: Get categories
        self.test_get_categories()
        
        # Test 6: Get stats
        self.test_get_stats()
        
        # Test 7: Purchase tickets
        self.test_purchase_tickets(test_raffle_id)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! API is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            failed_tests = [test for test in self.test_results if not test["success"]]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
            return False

def main():
    # Use the public endpoint from frontend/.env
    backend_url = "https://65673b09-749c-47ff-b761-9d28b7960cbf.preview.emergentagent.com"
    
    tester = RaffleAPITester(backend_url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())