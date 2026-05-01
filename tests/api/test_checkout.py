import allure
import pytest
import requests

@allure.feature("Checkout")
@allure.story("Successful Checkout")
@allure.title("Test successful checkout API")
@allure.description("This test verifies that a checkout request to httpbin.org returns 200 status code and echoes the JSON payload.")
@allure.severity(allure.severity_level.CRITICAL)
def test_checkout_success():
    payload = {
        "customer": "John Doe",
        "items": [{"name": "Product1", "quantity": 1}]
    }
    response = requests.post("https://httpbin.org/post", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["json"] == payload

@allure.feature("Checkout")
@allure.story("Failed Checkout")
@allure.title("Test checkout with invalid endpoint")
@allure.description("This test verifies that an invalid endpoint returns 404 status code.")
@allure.severity(allure.severity_level.CRITICAL)
def test_checkout_failure():
    response = requests.post("https://httpbin.org/status/404")
    assert response.status_code == 404