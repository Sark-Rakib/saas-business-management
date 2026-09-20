"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-ink-soft">{message}</p>}
    </Modal>
  );
}
