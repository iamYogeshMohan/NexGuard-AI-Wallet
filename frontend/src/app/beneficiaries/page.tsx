'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, Trash2, Send, ShieldCheck, AlertTriangle, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import { api } from '@/lib/api';

function CleanBeneficiariesContent() {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    upi_id: '',
    relationship: 'FRIEND',
    category: 'PEER',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const data = await api('/beneficiaries');
      setBeneficiaries(Array.isArray(data) ? data : []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api('/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      setFormData({ name: '', mobile: '', upi_id: '', relationship: 'FRIEND', category: 'PEER' });
      await fetchBeneficiaries();
    } catch (err: any) {
      setError(err?.message || 'Failed to add beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      await api(`/beneficiaries/${id}`, { method: 'DELETE' });
      await fetchBeneficiaries();
    } catch (err: any) {
      alert('Delete failed');
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/profile"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#fff', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569', textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Saved Beneficiaries
            </h1>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              Trusted contacts and verified payees
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '6px 12px',
            borderRadius: 12,
            background: '#2563eb',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
          }}
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      {/* Beneficiaries List */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Loading trusted payees...
          </div>
        ) : beneficiaries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            No beneficiaries added yet.
          </div>
        ) : (
          beneficiaries.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 16px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: '#eff6ff', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>
                  {b.name ? b.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{b.upi_id}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>
                      {b.relationship || 'FRIEND'}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
                      background: b.status === 'BLOCKED' ? '#fee2e2' : '#ecfdf5',
                      color: b.status === 'BLOCKED' ? '#dc2626' : '#047857',
                    }}>
                      {b.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link
                  href={`/send?recipient=${encodeURIComponent(b.name)}&upi=${encodeURIComponent(b.upi_id)}`}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: '#eff6ff',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Send size={12} />
                  <span>Pay</span>
                </Link>
                <button
                  onClick={() => handleDelete(b.id)}
                  style={{
                    padding: '6px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                  title="Remove Beneficiary"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400,
            padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Add Trusted Beneficiary
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>UPI ID</label>
                <input
                  type="text"
                  required
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="e.g. rahul@oksbi"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 00000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                {submitting ? 'Saving...' : 'Save Beneficiary'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BeneficiariesPage() {
  return (
    <NexGuardMobileLayout>
      <CleanBeneficiariesContent />
    </NexGuardMobileLayout>
  );
}
