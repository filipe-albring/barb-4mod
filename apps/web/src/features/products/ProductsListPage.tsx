'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CreateProductReservationSchema,
    type PaginatedResult,
    type PaymentMethod,
    type ProductReservationResponse,
    type ProductResponse,
} from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Modal, Pagination } from '../../components/ui';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const paymentMethodLabels: Record<PaymentMethod, string> = {
    PIX: 'Pix no balcão',
    CASH: 'Dinheiro',
    CARD: 'Cartão',
};

export default function ProductsListPage(): React.JSX.Element {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isCustomer = user?.role === 'CUSTOMER';
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [reservations, setReservations] = useState<ProductReservationResponse[]>([]);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isReserving, setIsReserving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: ProductResponse | null; isDeleting: boolean }>({
        isOpen: false,
        product: null,
        isDeleting: false,
    });

    const loadProducts = useCallback(async (targetPage: number) => {
        setLoading(true);
        setError('');
        try {
            const productRequest = api.get<PaginatedResult<ProductResponse>>('/products', {
                params: { page: targetPage, limit: isCustomer ? 100 : 6 },
            });
            const reservationRequest = isCustomer
                ? api.get<ProductReservationResponse[]>('/product-reservations/me')
                : Promise.resolve(null);
            const [productResponse, reservationResponse] = await Promise.all([productRequest, reservationRequest]);
            setProducts(productResponse.data.data);
            setPage(productResponse.data.page);
            setTotalPages(productResponse.data.totalPages);
            setTotalItems(productResponse.data.total);
            if (reservationResponse) setReservations(reservationResponse.data);
        } catch (err: unknown) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [isCustomer]);

    useEffect(() => {
        void loadProducts(page);
    }, [page, loadProducts]);

    const visibleProducts = isAdmin ? products : products.filter((product) => product.active);
    const cartItems = useMemo(() => visibleProducts
        .filter((product) => cart[product.id])
        .map((product) => ({ product, quantity: cart[product.id] })), [cart, visibleProducts]);
    const cartTotal = cartItems.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);

    function changeQuantity(product: ProductResponse, delta: number): void {
        setCart((previous) => {
            const current = previous[product.id] ?? 0;
            const next = Math.min(product.stock, Math.max(0, current + delta));
            if (next === 0) {
                const { [product.id]: _removed, ...remaining } = previous;
                return remaining;
            }
            return { ...previous, [product.id]: next };
        });
    }

    async function reserveProducts(): Promise<void> {
        setError('');
        setSuccess('');
        const parsed = CreateProductReservationSchema.safeParse({
            paymentMethod,
            items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? 'Revise os produtos selecionados.');
            return;
        }

        setIsReserving(true);
        try {
            await api.post('/product-reservations', parsed.data);
            setCart({});
            setSuccess('Reserva criada. Seus produtos serão separados para retirada e pagamento presencial.');
            await loadProducts(1);
        } catch (err: unknown) {
            setError(errorMessage(err));
        } finally {
            setIsReserving(false);
        }
    }

    async function confirmDelete(): Promise<void> {
        if (!deleteModal.product) return;
        setDeleteModal((previous) => ({ ...previous, isDeleting: true }));
        try {
            await api.delete(`/products/${deleteModal.product.id}`);
            setDeleteModal({ isOpen: false, product: null, isDeleting: false });
            await loadProducts(page);
        } catch (err: unknown) {
            setError(errorMessage(err));
            setDeleteModal((previous) => ({ ...previous, isDeleting: false }));
        }
    }

    return (
        <main className="page-wrap">
            <div className="page-heading-row">
                <section className="page-heading">
                    <span className="eyebrow">{isAdmin ? 'Estoque e Vendas' : 'Retirada na Barbearia'}</span>
                    <h1>{isAdmin ? 'Produtos da Barbearia' : 'Produtos disponíveis'}</h1>
                    <p>{isAdmin
                        ? 'Controle de pomadas, óleos, balms e itens de cuidados pessoais.'
                        : 'Reserve produtos para separação. O pagamento e a retirada acontecem presencialmente na barbearia.'}</p>
                </section>
                {isAdmin && <Link to="/produtos/novo" className="btn btn-primary">+ Cadastrar Produto</Link>}
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {loading ? (
                <p className="loading">Carregando estoque de produtos...</p>
            ) : visibleProducts.length === 0 ? (
                <div className="panel empty">Nenhum produto disponível no catálogo.</div>
            ) : (
                <div className="panel">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produto</th><th>Categoria</th><th>Estoque</th><th>Preço</th><th>Status</th>
                                    <th style={{ textAlign: 'right' }}>{isAdmin ? 'Ações' : 'Reserva'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td><strong>{product.name}</strong>{product.description && <div className="sub-text">{product.description}</div>}</td>
                                        <td>{product.category}</td>
                                        <td><Badge variant={product.stock > 5 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>{product.stock} un.</Badge></td>
                                        <td><strong>{currency.format(Number(product.price))}</strong></td>
                                        <td><Badge variant={product.active ? 'success' : 'neutral'}>{product.active ? 'Ativo' : 'Inativo'}</Badge></td>
                                        <td style={{ textAlign: 'right' }}>
                                            {isAdmin ? <>
                                                <Link to={`/produtos/${product.id}/editar`} className="btn btn-outline btn-sm">Editar</Link>{' '}
                                                <Button variant="danger" className="btn-sm" onClick={() => setDeleteModal({ isOpen: true, product, isDeleting: false })}>Excluir</Button>
                                            </> : isCustomer && product.stock > 0 ? <Button className="btn-sm" onClick={() => changeQuantity(product, 1)}>Adicionar</Button>
                                                : <span className="sub-text">Indisponível</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!isCustomer && <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />}
                </div>
            )}

            {isCustomer && cartItems.length > 0 && (
                <section className="panel form-panel">
                    <h2>Minha reserva</h2>
                    <p className="sub-text">Confira as quantidades e informe como pretende pagar no balcão.</p>
                    <div className="table-responsive">
                        <table className="data-table"><tbody>{cartItems.map(({ product, quantity }) => (
                            <tr key={product.id}>
                                <td><strong>{product.name}</strong><div className="sub-text">{currency.format(Number(product.price))} por unidade</div></td>
                                <td style={{ textAlign: 'right' }}>
                                    <Button variant="outline" className="btn-sm" onClick={() => changeQuantity(product, -1)}>−</Button>{' '}
                                    <strong>{quantity}</strong>{' '}
                                    <Button variant="outline" className="btn-sm" disabled={quantity >= product.stock} onClick={() => changeQuantity(product, 1)}>+</Button>
                                </td>
                            </tr>
                        ))}</tbody></table>
                    </div>
                    <label className="field">Método de pagamento presencial
                        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                            <option value="PIX">Pix no balcão</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option>
                        </select>
                    </label>
                    <div className="total-highlight"><span>Total estimado para pagamento presencial</span><h3>{currency.format(cartTotal)}</h3></div>
                    <Button onClick={() => void reserveProducts()} isLoading={isReserving}>Reservar para retirada</Button>
                </section>
            )}

            {isCustomer && reservations.length > 0 && (
                <section className="panel">
                    <h2>Minhas reservas para retirada</h2>
                    <div className="table-responsive"><table className="data-table"><thead><tr><th>Produtos</th><th>Pagamento</th><th>Total</th><th>Status</th></tr></thead><tbody>
                        {reservations.map((reservation) => <tr key={reservation.id}>
                            <td>{reservation.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</td>
                            <td>{paymentMethodLabels[reservation.paymentMethod]}</td><td><strong>{currency.format(reservation.totalPrice)}</strong></td>
                            <td><Badge variant="warning">Separando para retirada</Badge></td>
                        </tr>)}
                    </tbody></table></div>
                </section>
            )}

            <Modal
                isOpen={isAdmin && deleteModal.isOpen}
                title="Excluir Produto"
                description={`Tem certeza que deseja remover o produto "${deleteModal.product?.name}" do sistema?`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDanger
                isLoading={deleteModal.isDeleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteModal({ isOpen: false, product: null, isDeleting: false })}
            />
        </main>
    );
}
