"""
NexGuard Secure Wallet — Server Operations Direct Integration Test Suite
Tests all 12 operational monitoring endpoints, status updates, device actions,
and cross-checking relationship graph functionality directly.
"""

import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.bootstrap import seed_database
from app.models import User, Device, DeviceSession, NGBankAccount, Wallet
from app.routers.server_ops import (
    get_system_overview,
    list_users,
    get_user_detail,
    update_user_status,
    list_accounts,
    update_account_status,
    list_wallets,
    update_wallet_status,
    list_server_transactions,
    list_server_devices,
    execute_device_action,
    list_server_sessions,
    invalidate_session,
    get_live_activity,
    cross_check_entity,
    get_usage_analytics,
    get_server_health,
    global_server_search,
    StatusUpdateRequest,
    DeviceActionRequest,
)

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    seed_database(session)
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


def test_server_overview(db):
    data = get_system_overview(db=db)
    assert "kpis" in data
    assert "decisions" in data
    assert "health" in data
    assert data["kpis"]["total_users"] > 0
    assert data["health"]["database"]["status"] == "OPERATIONAL"


def test_server_users(db):
    data = list_users(page=1, limit=15, search=None, status=None, role=None, sort_by="created_at", sort_dir="desc", db=db)
    assert data["total"] > 0
    assert len(data["items"]) > 0
    first_user = data["items"][0]
    assert "customer_id" in first_user
    assert "wallet_balance" in first_user


def test_server_user_detail(db):
    user = db.query(User).first()
    data = get_user_detail(user_id=user.id, db=db)
    assert "profile" in data
    assert "account" in data
    assert "wallet" in data
    assert "devices" in data
    assert "sessions" in data
    assert "beneficiaries" in data


def test_server_user_status_update(db):
    user = db.query(User).first()
    res = asyncio.run(update_user_status(user_id=user.id, req=StatusUpdateRequest(status="RESTRICTED", reason="Testing status change"), db=db))
    assert res["status"] == "SUCCESS"
    assert res["new_status"] == "RESTRICTED"
    # Restore to active
    asyncio.run(update_user_status(user_id=user.id, req=StatusUpdateRequest(status="ACTIVE", reason="Restore"), db=db))


def test_server_accounts(db):
    data = list_accounts(page=1, limit=15, search=None, status=None, sort_by="created_at", sort_dir="desc", db=db)
    assert data["total"] > 0
    assert "account_number" in data["items"][0]


def test_server_wallets(db):
    data = list_wallets(page=1, limit=15, search=None, status=None, sort_by="id", sort_dir="desc", db=db)
    assert "summary" in data
    assert data["total"] > 0
    assert data["summary"]["total"] > 0


def test_server_transactions(db):
    data = list_server_transactions(page=1, limit=15, search=None, decision=None, min_amount=None, max_amount=None, min_risk=None, max_risk=None, device_id=None, sort_by="created_at", sort_dir="desc", db=db)
    assert "stats" in data
    assert "items" in data


def test_server_devices_and_actions(db):
    data = list_server_devices(page=1, limit=15, search=None, status=None, sort_by="last_seen", sort_dir="desc", db=db)
    assert data["total"] > 0
    dev_id = data["items"][0]["device_id"]

    # Quarantine action
    q_res = asyncio.run(execute_device_action(device_id=dev_id, req=DeviceActionRequest(action="quarantine", reason="Test quarantine"), db=db))
    assert q_res["status"] == "SUCCESS"
    assert q_res["trust_level"] == "SUSPICIOUS"

    # Restore action
    r_res = asyncio.run(execute_device_action(device_id=dev_id, req=DeviceActionRequest(action="restore", reason="Test restore"), db=db))
    assert r_res["status"] == "SUCCESS"
    assert r_res["trust_level"] == "TRUSTED"


def test_server_sessions_and_invalidate(db):
    data = list_server_sessions(page=1, limit=15, search=None, status=None, sort_by="created_at", sort_dir="desc", db=db)
    assert "items" in data
    if data["items"]:
        first_sess = data["items"][0]
        inv_res = asyncio.run(invalidate_session(session_id=first_sess["id"], db=db))
        assert inv_res["status"] == "SUCCESS"
        assert inv_res["is_active"] is False


def test_server_activity(db):
    data = get_live_activity(page=1, limit=30, event_type=None, search=None, db=db)
    assert "items" in data


def test_server_cross_check(db):
    user = db.query(User).first()
    data = cross_check_entity(entity_type="customer", entity_id=str(user.id), db=db)
    assert "graph" in data
    assert "signals" in data
    assert len(data["graph"]["nodes"]) > 0


def test_server_analytics(db):
    data = get_usage_analytics(db=db)
    assert "user_analytics" in data
    assert "transaction_analytics" in data
    assert "security_analytics" in data


def test_server_health(db):
    data = get_server_health(db=db)
    assert "services" in data
    assert len(data["services"]) >= 5


def test_server_search(db):
    data = global_server_search(q="Rahul", db=db)
    assert "results" in data
