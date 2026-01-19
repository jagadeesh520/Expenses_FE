import React from "react";
import WorkerTransactionsPage, { TRANSACTION_TYPES } from "./WorkerTransactionsPage";

export default function WorkerRefunds() {
  return <WorkerTransactionsPage transactionType={TRANSACTION_TYPES.REFUND} />;
}

