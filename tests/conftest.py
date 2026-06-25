import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activity_store

INITIAL_ACTIVITIES = copy.deepcopy(activity_store)


@pytest.fixture(autouse=True)
def reset_activities():
    activity_store.clear()
    activity_store.update(copy.deepcopy(INITIAL_ACTIVITIES))
    yield


@pytest.fixture
def client():
    return TestClient(app)
