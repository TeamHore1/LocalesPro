import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import "./CashierAccounts.css";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "rejected", label: "Ditolak" },
];

const STATUS_LABELS = {
  pending: "Menunggu Review",
  active: "Aktif",
  inactive: "Nonaktif",
  rejected: "Ditolak",
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const CashierAccounts = () => {
  const { branches } = useApp();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    active: 0,
    inactive: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");
  const [branchSelections, setBranchSelections] = useState({});
  const [reviewNotes, setReviewNotes] = useState({});

  const totalAccounts = useMemo(
    () => Object.values(counts).reduce((total, current) => total + current, 0),
    [counts],
  );

  const fetchAccounts = useCallback(async (nextFilter = filter) => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/users/registrations.php?status=${nextFilter}`);

      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Gagal memuat akun kasir.");
      }

      const payload = response.data.data || {};
      const nextItems = payload.items || [];

      setItems(nextItems);
      setCounts(payload.counts || {
        pending: 0,
        active: 0,
        inactive: 0,
        rejected: 0,
      });

      setBranchSelections((current) => {
        const updated = { ...current };
        nextItems.forEach((item) => {
          if (!updated[item.id]) {
            updated[item.id] = String(item.branch_id || "");
          }
        });
        return updated;
      });

      setReviewNotes((current) => {
        const updated = { ...current };
        nextItems.forEach((item) => {
          if (updated[item.id] === undefined) {
            updated[item.id] = item.review_note || "";
          }
        });
        return updated;
      });
    } catch (fetchError) {
      setError(
        fetchError.userMessage ||
          fetchError.response?.data?.message ||
          fetchError.message ||
          "Gagal memuat akun kasir.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAccounts(filter);
  }, [fetchAccounts, filter]);

  const handleAction = async (item, action) => {
    const selectedBranchId = Number(branchSelections[item.id] || item.branch_id || 0);
    const reviewNote = String(reviewNotes[item.id] || "").trim();

    if ((action === "approve" || action === "activate") && selectedBranchId <= 0) {
      setError("Pilih cabang penempatan kasir terlebih dahulu.");
      return;
    }

    try {
      setSubmittingKey(`${item.id}:${action}`);
      setError("");

      const response = await api.post("/users/review.php", {
        id: item.id,
        action,
        branch_id:
          action === "approve" || action === "activate" ? selectedBranchId : item.branch_id,
        review_note: reviewNote,
      });

      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Gagal memperbarui akun kasir.");
      }

      await fetchAccounts(filter);
    } catch (actionError) {
      setError(
        actionError.userMessage ||
          actionError.response?.data?.message ||
          actionError.message ||
          "Gagal memperbarui akun kasir.",
      );
    } finally {
      setSubmittingKey("");
    }
  };

  return (
    <div className="cashier-accounts-page">
      <div className="cashier-accounts-header">
        <div>
          <h2>Review Akun Kasir</h2>
          <p>
            Tinjau pendaftaran kasir baru, tentukan cabang penempatan, lalu aktifkan
            akun jika data sudah valid.
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchAccounts(filter)} disabled={loading}>
          {loading ? "Memuat..." : "Refresh Data"}
        </Button>
      </div>

      <div className="cashier-accounts-stats">
        <div className="cashier-stat-card">
          <span>Total Akun Kasir</span>
          <strong>{totalAccounts}</strong>
        </div>
        <div className="cashier-stat-card pending">
          <span>Menunggu Review</span>
          <strong>{counts.pending || 0}</strong>
        </div>
        <div className="cashier-stat-card active">
          <span>Akun Aktif</span>
          <strong>{counts.active || 0}</strong>
        </div>
        <div className="cashier-stat-card rejected">
          <span>Nonaktif / Ditolak</span>
          <strong>{(counts.inactive || 0) + (counts.rejected || 0)}</strong>
        </div>
      </div>

      <div className="cashier-filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`cashier-filter-button ${filter === item.value ? "active" : ""}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="cashier-page-error">{error}</div>}

      {loading ? (
        <div className="cashier-empty-state">Sedang memuat akun kasir...</div>
      ) : items.length === 0 ? (
        <div className="cashier-empty-state">
          Belum ada akun kasir pada filter ini.
        </div>
      ) : (
        <div className="cashier-account-grid">
          {items.map((item) => {
            const actionKey = `${item.id}:`;
            const isBusy = submittingKey.startsWith(actionKey);
            const selectedBranch = branchSelections[item.id] || String(item.branch_id || "");

            return (
              <div key={item.id} className="cashier-account-card">
                <div className="cashier-account-top">
                  <div>
                    <h3>{item.full_name || item.username}</h3>
                    <p>@{item.username}</p>
                  </div>
                  <span className={`cashier-status-badge ${item.status}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>

                <div className="cashier-account-meta">
                  <div>
                    <span>Email</span>
                    <strong>{item.email || "-"}</strong>
                  </div>
                  <div>
                    <span>No. HP</span>
                    <strong>{item.phone || "-"}</strong>
                  </div>
                  <div>
                    <span>Cabang Tujuan</span>
                    <strong>{item.branch_name || "Belum ditentukan"}</strong>
                  </div>
                  <div>
                    <span>Didaftarkan</span>
                    <strong>{formatDateTime(item.created_at)}</strong>
                  </div>
                </div>

                {item.registration_note && (
                  <div className="cashier-note-box">
                    <span>Catatan Pendaftar</span>
                    <p>{item.registration_note}</p>
                  </div>
                )}

                <div className="cashier-review-section">
                  <label>
                    Cabang Penempatan
                    <select
                      value={selectedBranch}
                      onChange={(event) =>
                        setBranchSelections((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      disabled={isBusy}
                    >
                      <option value="">Pilih cabang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Catatan Admin
                    <textarea
                      rows="3"
                      value={reviewNotes[item.id] || ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Opsional: alasan approve, penolakan, atau catatan penempatan."
                      disabled={isBusy}
                    />
                  </label>
                </div>

                <div className="cashier-review-footer">
                  <div className="cashier-review-info">
                    <span>Review terakhir</span>
                    <strong>{formatDateTime(item.approved_at)}</strong>
                    <small>
                      {item.approved_by_name || item.approved_by_username
                        ? `oleh ${item.approved_by_name || item.approved_by_username}`
                        : "Belum direview"}
                    </small>
                  </div>

                  <div className="cashier-action-group">
                    {item.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(item, "reject")}
                          disabled={isBusy}
                        >
                          {submittingKey === `${item.id}:reject` ? "Memproses..." : "Tolak"}
                        </Button>
                        <Button
                          onClick={() => handleAction(item, "approve")}
                          disabled={isBusy}
                        >
                          {submittingKey === `${item.id}:approve`
                            ? "Memproses..."
                            : "Setujui"}
                        </Button>
                      </>
                    )}

                    {item.status === "active" && (
                      <Button
                        variant="outline"
                        onClick={() => handleAction(item, "deactivate")}
                        disabled={isBusy}
                      >
                        {submittingKey === `${item.id}:deactivate`
                          ? "Memproses..."
                          : "Nonaktifkan"}
                      </Button>
                    )}

                    {(item.status === "inactive" || item.status === "rejected") && (
                      <Button
                        onClick={() => handleAction(item, "activate")}
                        disabled={isBusy}
                      >
                        {submittingKey === `${item.id}:activate`
                          ? "Memproses..."
                          : "Aktifkan Lagi"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CashierAccounts;
