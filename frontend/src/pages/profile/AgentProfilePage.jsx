import { useEffect, useState } from "react";

import PageShell from "../../components/layout/PageShell";
import PropertyMiniCard from "../../components/property/PropertyMiniCard";

import { api } from "../../api";

import sampleProperties from "../../data/sampleProperties";

import "../ExtraPages.css";

export default function AgentProfilePage() {

  const [agent, setAgent] = useState({

    name: "Nguyễn Văn A",

    email: "agent@example.com",

    phone: "0901 234 567",

    properties: sampleProperties

  });

  useEffect(() => {

    const id = queryId();

    if (!id) return;

    api.agent(id).then((data) =>

      data && setAgent(data)

    );

  }, []);

  return (

    <PageShell
      eyebrow="Hồ sơ môi giới"
      title={agent.name}
      desc={`${agent.email} · ${agent.phone}`}
    >

      <div className="dashboard-stats">

        <div>

          <strong>

            {

              agent.properties?.length || 0

            }

          </strong>

          <span>
            Tin đang phụ trách
          </span>

        </div>

        <div>

          <strong>

            {

              agent.lat ?? "-"

            }

          </strong>

          <span>
            Vĩ độ
          </span>

        </div>

        <div>

          <strong>

            {

              agent.lng ?? "-"

            }

          </strong>

          <span>
            Kinh độ
          </span>

        </div>

      </div>

      <div className="extra-top-actions">

        <a
          className="btn-geo-secondary"
          href={`tel:${
            agent.phone || "0901234567"
          }`}
        >

          Gọi ngay

        </a>

        <a
          className="btn-admin"
          href={`mailto:${
            agent.email || "agent@example.com"
          }`}
        >

          Gửi email

        </a>

      </div>

      <div className="mini-grid">

        {

          (
            agent.properties
            || sampleProperties
          ).map((p) => (

            <PropertyMiniCard
              p={p}
              key={p.id}
            />

          ))

        }

      </div>

    </PageShell>

  );

}