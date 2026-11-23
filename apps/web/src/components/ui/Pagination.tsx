import React from 'react';
import { Button } from './Button';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-container">
            <span className="pagination-info">
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalItems} itens no total)
            </span>
            <div className="pagination-actions">
                <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    &laquo; Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pagination-ellipsis">...</span>}
                            <button
                                type="button"
                                className={`pagination-page-btn ${p === currentPage ? 'active' : ''}`}
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </button>
                        </React.Fragment>
                    ))}
                <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Próxima &raquo;
                </Button>
            </div>
        </div>
    );
};
