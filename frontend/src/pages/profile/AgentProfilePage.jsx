import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../../App.css";

import { api } from "../../api";
import PropertyMiniCard from "../../components/property/PropertyMiniCard";

export default function AgentProfilePage() {
  const { id } =
    useParams();

  const [loading, setLoading] =
    useState(true);

  const [agent, setAgent] =
    useState(null);

  useEffect(() => {
    async function loadAgent() {
      try {
        const id =
          id;

        if (!id) {
          setLoading(false);
          return;
        }

        const data =
          await api.agent(id);

        if (data) {
          setAgent(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="extra-card">
          Đang tải môi giới...
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container py-5">
        <div className="extra-card">
          Không tìm thấy môi giới.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="extra-card">
        <div className="agent-profile-top">
          <div className="agent-profile-left">
            <img
              src={
                agent.avatar ||
                `https://ui-avatars.com/api/?background=d4af37&color=111&name=${encodeURIComponent(
                  agent.name || "Agent"
                )}`
              }
              alt={agent.name}
              className="agent-profile-avatar"
            />

            <div>
              <p className="section-mini-title">
                Hồ sơ môi giới
              </p>

              <h1 className="section-heading">
                {agent.name}
              </h1>

              <p className="muted-line">
                {agent.email}
              </p>

              <p className="muted-line">
                {agent.phone}
              </p>
            </div>
          </div>

          <div className="extra-top-actions">
            <a
              className="btn-geo-secondary"
              href={`tel:${
                agent.phone || ""
              }`}
            >
              Gọi ngay
            </a>

            <a
              className="btn-geo-primary"
              href={`mailto:${
                agent.email || ""
              }`}
            >
              Gửi email
            </a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="dashboard-stats">
        <div className="extra-card">
          <strong>
            {agent.properties?.length ||
              0}
          </strong>

          <span>
            Tin đang phụ trách
          </span>
        </div>

        <div className="extra-card">
          <strong>
            {agent.lat ?? "-"}
          </strong>

          <span>Vĩ độ</span>
        </div>

        <div className="extra-card">
          <strong>
            {agent.lng ?? "-"}
          </strong>

          <span>Kinh độ</span>
        </div>
      </div>

      {/* PROPERTIES */}
      <div className="extra-card">
        <h2
          className="section-heading"
          style={{
            marginBottom: 24,
          }}
        >
          Bất động sản phụ trách
        </h2>

        {agent.properties?.length >
        0 ? (
          <div className="mini-grid">
            {agent.properties.map(
              (p) => (
                <PropertyMiniCard
                  p={p}
                  key={p.id}
                />
              )
            )}
          </div>
        ) : (
          <p className="muted-line">
            Chưa có bất động sản.
          </p>
        )}
      </div>
    </div>
  );
}
