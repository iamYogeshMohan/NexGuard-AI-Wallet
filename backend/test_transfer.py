import urllib.request
import json

# 1. Fetch balances before
res1 = urllib.request.urlopen('http://localhost:8000/api/wallet/peers')
peers_before = {p['username']: p['balance'] for p in json.loads(res1.read().decode('utf-8'))}
print('=== BEFORE TRANSFER ===')
print('Karthik balance: INR', peers_before['karthik'])
print('Priya balance:   INR', peers_before['priya'])

# 2. Transfer INR 1,500 from Karthik to Priya
payload = json.dumps({
    'amount': 1500,
    'currency': 'INR',
    'merchant': 'Priya Sharma',
    'merchant_category': 'PEER',
    'recipient_upi': 'priya@nexguard',
    'purpose': 'Lunch split transfer',
    'device_id': 'DEVICE-001',
    'session_id': 'SES-1024',
    'location': 'Chennai, IN [SYNTHETIC]',
    'demo_ip': '192.168.1.104',
    'ip_type': 'PRIVATE',
    'transaction_type': 'UPI_TRANSFER',
    'payment_method': 'UPI',
    'biometric_verified': True,
    'biometric_confidence': 0.98
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/transactions',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
txn_res = urllib.request.urlopen(req)
txn_data = json.loads(txn_res.read().decode('utf-8'))
print('\n=== TRANSACTION RESULT ===')
print('Txn ID: ', txn_data.get('transaction_id_str'))
print('Status: ', txn_data.get('status'))
print('Risk:   ', txn_data.get('risk_score'), '/ 100')

# 3. Fetch balances after
res2 = urllib.request.urlopen('http://localhost:8000/api/wallet/peers')
peers_after = {p['username']: p['balance'] for p in json.loads(res2.read().decode('utf-8'))}
print('\n=== AFTER TRANSFER ===')
print('Karthik balance: INR', peers_after['karthik'], f"(Change: {peers_after['karthik'] - peers_before['karthik']})")
print('Priya balance:   INR', peers_after['priya'], f"(Change: +{peers_after['priya'] - peers_before['priya']})")
