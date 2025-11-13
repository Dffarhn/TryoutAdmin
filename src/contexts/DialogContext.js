"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Dialog } from "@/components/ui/Dialog";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title || "Informasi",
        description: message,
        variant: options.variant || "info",
        confirmText: options.confirmText || "OK",
        showCancel: false,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onClose: () => {
          setDialog(null);
          resolve(true);
        },
      });
    });
  }, []);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title || "Konfirmasi",
        description: options.description || options.message || "Apakah Anda yakin?",
        variant: options.variant || "confirm",
        confirmText: options.confirmText || "Ya",
        cancelText: options.cancelText || "Batal",
        showCancel: true,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        },
        onClose: () => {
          setDialog(null);
          resolve(false);
        },
        closeOnOverlayClick: options.closeOnOverlayClick !== false,
      });
    });
  }, []);

  const showDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title || "Dialog",
        description: options.description,
        variant: options.variant || "info",
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText || "Batal",
        showCancel: options.showCancel !== false,
        children: options.content || options.children,
        onConfirm: () => {
          if (options.onConfirm) {
            options.onConfirm();
          }
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel();
          }
          setDialog(null);
          resolve(false);
        },
        onClose: () => {
          setDialog(null);
          resolve(false);
        },
        closeOnOverlayClick: options.closeOnOverlayClick !== false,
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showDialog, closeDialog }}>
      {children}
      {dialog && (
        <Dialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          description={dialog.description}
          variant={dialog.variant}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          showCancel={dialog.showCancel}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
          onClose={dialog.onClose}
          closeOnOverlayClick={dialog.closeOnOverlayClick}
        >
          {dialog.children}
        </Dialog>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}

