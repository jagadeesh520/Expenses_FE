import React from "react";
import WorkerTransactionsPage, { TRANSACTION_TYPES } from "./WorkerTransactionsPage";

export default function WorkerDisbursements() {
  return <WorkerTransactionsPage transactionType={TRANSACTION_TYPES.DISBURSEMENT} />;
}

