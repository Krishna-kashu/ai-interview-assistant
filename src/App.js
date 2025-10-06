// App.js
import "antd/dist/reset.css";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import Interviewee from "./components/Interviewee";
import Interviewer from "./components/Interviewer";
import { Tabs, Layout } from "antd";
import ErrorBoundary from "./components/ErrorBoundary";

const { Header, Content } = Layout;

export default function App() {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Layout style={{ minHeight: "100vh" }}>
          <Header style={{ background: "#001529", color: "#fff", fontSize: "20px" }}>
            AI-Powered Interview Assistant
          </Header>
          <Content style={{ padding: "20px" }}>
            <ErrorBoundary>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                size="large"
                centered
                items={[
                  {
                    key: "1",
                    label: "Interviewee",
                    children: <Interviewee />,
                  },
                  {
                    key: "2",
                    label: "Interviewer",
                    children: <Interviewer />,
                  },
                ]}
              />

            </ErrorBoundary>

          </Content>
        </Layout>
      </PersistGate>
    </Provider>
  );
}
