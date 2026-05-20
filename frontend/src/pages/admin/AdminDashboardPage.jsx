import { useEffect, useState } from "react";

import "../../App.css";

import { api } from "../../api";

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState({
      properties: 0,
      agents: 0,
      users: 0,
      imports: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data =
          await api.dashboard();

        if (data) {
          setStats({
            properties:
              data.property_total || 0,

            agents:
              data.agent_total || 0,

            users:
              data.lead_total || 0,

            imports:
              data.appointment_total || 0,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="mb-4">
        <p className="section-mini-title">
          Quản trị
        </p>

        <h1 className="section-heading">
          Bảng điều khiển quản trị
        </h1>

        <p className="muted-line">
          Theo dõi hệ thống bất động
          sản theo thời gian thực.
        </p>
      </div>

      {/* STATS */}
      <div className="dashboard-stats">
        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.properties}
          </strong>

          <span>
            Bất động sản
          </span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.agents}
          </strong>

          <span>Môi giới</span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.users}
          </strong>

          <span>Người dùng</span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.imports}
          </strong>

          <span>Lượt import</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="extra-card">
        <h2
          className="section-heading"
          style={{
            marginBottom: 20,
          }}
        >
          Tổng quan hệ thống
        </h2>

        <p className="muted-line">
          Dashboard quản trị giúp
          theo dõi số lượng bất động
          sản, môi giới và hoạt động
          của hệ thống.
        </p>
      </div>
    </div>
  );
}
