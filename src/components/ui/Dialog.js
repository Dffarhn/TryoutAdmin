"use client";

import { useEffect } from "react";
import { Button } from "./Button";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  variant = "info",
  confirmText = "OK",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  showCancel = true,
  children,
  closeOnOverlayClick = true,
}) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e) {
      if (e.key === "Escape") {
        if (onCancel) {
          onCancel();
        } else {
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantConfig = {
    alert: {
      icon: Info,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      confirmVariant: "primary",
    },
    confirm: {
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
      confirmVariant: "primary",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      confirmVariant: "primary",
    },
    danger: {
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      confirmVariant: "danger",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      confirmVariant: "primary",
    },
  };

  const config = variantConfig[variant] || variantConfig.info;
  const Icon = config.icon;

  function handleOverlayClick(e) {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      if (onCancel) {
        onCancel();
      } else {
        onClose();
      }
    }
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease-out" }} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200" style={{ animation: "scaleIn 0.2s ease-out" }}>
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-200">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {!showCancel && (
            <button
              onClick={handleCancel}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {children && (
          <div className="p-6">
            {children}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {showCancel && (
            <Button variant="secondary" onClick={handleCancel}>
              {cancelText}
            </Button>
          )}
          <Button variant={config.confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>

    </div>
  );
}

