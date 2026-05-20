import sampleProperties from "../../data/sampleProperties";

export function AdminConsolePage() {

  return (

    <PageShell
      eyebrow="Quản trị hệ thống"
      title="Admin Console"
    >

      <div className="admin-shell-copy">

        <aside className="admin-tabs">

          <button className="active">
            Properties
          </button>

          <button>
            Leads
          </button>

          <button>
            Agents
          </button>

          <button>
            Amenities
          </button>

        </aside>

        <section className="extra-card">

          <h3>
            Bảng dữ liệu
          </h3>

          <table className="admin-table">

            <thead>

              <tr>

                <th>ID</th>

                <th>Tên</th>

                <th>Trạng thái</th>

                <th>Cập nhật</th>

              </tr>

            </thead>

            <tbody>

              {

                sampleProperties.map((p) => (

                  <tr key={p.id}>

                    <td>
                      {p.id}
                    </td>

                    <td>
                      {p.title}
                    </td>

                    <td>
                      {p.listing_status}
                    </td>

                    <td>
                      Hôm nay
                    </td>

                  </tr>

                ))

              }

            </tbody>

          </table>

        </section>

        <form className="extra-card form-stack">

          <h3>
            Tạo / cập nhật
          </h3>

          <Field
            label="Tên bản ghi"
          />

          <Field
            label="Mô tả"
            as="textarea"
          />

          <button className="btn-geo-primary">

            Lưu

          </button>

        </form>

      </div>

    </PageShell>

  );

}

export default AdminConsolePage;