// components/Interviewer.js
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Table, Modal, Typography } from "antd";

const { Title, Text } = Typography;

export default function Interviewer() {
  const candidates = useSelector((state) => state.candidates.list);
  const [selected, setSelected] = useState(null);

  // Sort candidates by score (descending), handle undefined score
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [candidates]);

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      render: (score) => score || 0,
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Title level={3}>Candidate Dashboard</Title>

      <Table
        columns={columns}
        dataSource={sortedCandidates.map((c) => ({ ...c, key: c.id }))}
        onRow={(record) => ({
          onClick: () => setSelected(record),
        })}
        pagination={{ pageSize: 5 }}
      />

      {selected && (
        <Modal
          open={!!selected}
          title={`${selected.name}'s Details`}
          onCancel={() => setSelected(null)}
          onOk={() => setSelected(null)}
          width={700}
        >
          <Text strong>Name:</Text> {selected.name} <br />
          <Text strong>Email:</Text> {selected.email} <br />
          <Text strong>Phone:</Text> {selected.phone} <br />
          <Text strong>Score:</Text> {selected.score || 0} <br />
          <Text strong>Answers:</Text>
          {selected.answers.length === 0 && <div>No answers submitted</div>}
          {selected.answers.map((a, i) => (
            <div key={i} style={{ margin: "5px 0", padding: "5px", borderBottom: "1px solid #f0f0f0" }}>
              <Text strong>Q{i + 1}:</Text> {a.question} <br />
              <Text strong>A{i + 1}:</Text> {a.answer || "No Answer"}
            </div>
          ))}
          <Text strong>AI Summary:</Text> This candidate answered {selected.answers.length} question
          {selected.answers.length > 1 ? "s" : ""}.
        </Modal>
      )}
    </div>
  );
}
