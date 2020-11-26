import React from "react";
import styles from "./Header.module.scss";

const Header: React.FC = () => (
  <div className={styles.block}>
    <header className={styles.header}>Main app</header>
  </div>
);

export default Header;
