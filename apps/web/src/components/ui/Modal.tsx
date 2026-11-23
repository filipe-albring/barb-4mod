import React from 'react';
import { Button } from './Button';

export interface ModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false,
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
                <h3>{title}</h3>
                {description && <p className="modal-desc">{description}</p>}
                <div className="modal-actions">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={isDanger ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
