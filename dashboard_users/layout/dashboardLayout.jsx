import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navbar";
import styles from "./dashboardLayout.module.css";

const DashboardLayout = () => {
  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
