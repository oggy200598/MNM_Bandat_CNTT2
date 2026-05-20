import { useEffect, useState } from "react";
import { api } from "../../api";

export function AdminDashboardPage() {

  const [stats, setStats] = useState({
    properties: 0,
    agents: 0,
    users: 0,
    imports: 0
  });

  const [file, setFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  useEffect(() => {

    setStats({
      properties: 0,
      agents: 0,
      users: 0,
      imports: 0
    });

  }, []);

  const handleFile = (e) => {

    const f =
      e.target.files?.[0];

    if (f) {

      setFile(f);

    }

  };

  const handleSubmit = async () => {

    if (!file) return;

    setLoading(true);

    const text =
      await file.text();

    const res =
      await api.importPropertiesCSV(
        text
      );

    setLoading(false);

    setResult(res);

  };

  return (

    <PageShell
      eyebrow="Quản trị"
      title="Bảng điều khiển quản trị"
    >

      <div className="container">

        <div className="dashboard-grid">

          <div className="mini-card">

            <strong>
              Thống kê
            </strong>

            <p>

              Properties:
              {" "}
              {stats.properties}

              {" · "}

              Agents:
              {" "}
              {stats.agents}

              {" · "}

              Users:
              {" "}
              {stats.users}

              {" · "}

              Imports:
              {" "}
              {stats.imports}

            </p>

          </div>

          <div className="mini-card">

            <strong>
              Nhập CSV
            </strong>

            <p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFile}
                disabled={loading}
              />

              <br />

              <button
                className="btn-geo-primary"
                onClick={handleSubmit}
                disabled={
                  !file || loading
                }
              >

                {

                  loading
                    ? "Đang nhập..."
                    : "Nhập"

                }

              </button>

              {

                result && (

                  <p>

                    Kết quả:
                    {" "}
                    {JSON.stringify(result)}

                  </p>

                )

              }

            </p>

          </div>

        </div>

      </div>

    </PageShell>

  );

}

export default AdminDashboardPage;