import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  MapPin,
  User,
  Phone,
  Package,
  Loader2,
  Download,
  RotateCcw
} from 'lucide-react';
import {
  getOrderDetails,
  searchOrder,
  checkoutOrder,
  reimbursementOrder,
  getOrderAuditLogs,
  getPendingOrders,
  getCompletedOrders,
  getRefundedOrders,
  exportOrdersToCSV,
  type OrderDetails,
  type AuditLog
} from '../../services/checkoutService';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'search' | 'pending' | 'completed' | 'refunded';

interface CheckoutState {
  order: OrderDetails | null;
  auditLogs: AuditLog[];
  loading: boolean;
  error: string;
  success: string;
}

export const QuickMartCheckout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    order: null,
    auditLogs: [],
    loading: false,
    error: '',
    success: ''
  });

  // Dialog states
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showReimbursementDialog, setShowReimbursementDialog] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Reimbursement form state
  const [reimbursementForm, setReimbursementForm] = useState({
    reason: '',
    amount: '',
    notes: ''
  });

  // List states
  const [pendingOrders, setPendingOrders] = useState<OrderDetails[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderDetails[]>([]);
  const [refundedOrders, setRefundedOrders] = useState<OrderDetails[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const adminName = user?.name || 'System';
  const adminId = user?.id || 'system';

  // Search for order
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setCheckoutState(prev => ({
        ...prev,
        error: 'Please enter an order number'
      }));
      return;
    }

    setCheckoutState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const order = await getOrderDetails(searchQuery);

      if (!order) {
        setCheckoutState(prev => ({
          ...prev,
          error: 'Order not found',
          order: null,
          auditLogs: [],
          loading: false
        }));
        return;
      }

      const logs = await getOrderAuditLogs(order.order_reference);

      setCheckoutState(prev => ({
        ...prev,
        order,
        auditLogs: logs,
        error: '',
        success: '',
        loading: false
      }));
    } catch (error) {
      setCheckoutState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to search order',
        loading: false
      }));
    }
  };

  // Handle checkout action
  const handleCheckout = async () => {
    if (!checkoutState.order) return;

    setCheckoutState(prev => ({ ...prev, loading: true, error: '' }));

    const result = await checkoutOrder({
      order_number: checkoutState.order.order_reference,
      action: 'checkout',
      admin_id: adminId,
      admin_name: adminName,
      notes: `Checked out at physical pickup location`
    });

    if (result.success) {
      setCheckoutState(prev => ({
        ...prev,
        success: result.message,
        order: prev.order ? { ...prev.order, status: 'picked_up' } : null,
        loading: false
      }));
      setShowCheckoutConfirm(false);
      setTimeout(() => {
        setCheckoutState(prev => ({ ...prev, success: '' }));
        setSearchQuery('');
        handleSearchOrder({ preventDefault: () => {} } as any);
      }, 2000);
    } else {
      setCheckoutState(prev => ({
        ...prev,
        error: result.message,
        loading: false
      }));
    }
  };

  // Handle reimbursement
  const handleReimbursement = async () => {
    if (!checkoutState.order || !reimbursementForm.reason) return;

    setCheckoutState(prev => ({ ...prev, loading: true, error: '' }));

    const result = await reimbursementOrder({
      order_number: checkoutState.order.order_reference,
      reason: reimbursementForm.reason,
      amount: reimbursementForm.amount ? parseInt(reimbursementForm.amount) : undefined,
      admin_id: adminId,
      admin_name: adminName,
      notes: reimbursementForm.notes
    });

    if (result.success) {
      setCheckoutState(prev => ({
        ...prev,
        success: result.message,
        order: prev.order ? { ...prev.order, status: 'refunded' } : null,
        loading: false
      }));
      setShowReimbursementDialog(false);
      setReimbursementForm({ reason: '', amount: '', notes: '' });
      setTimeout(() => {
        setCheckoutState(prev => ({ ...prev, success: '' }));
        setSearchQuery('');
      }, 2000);
    } else {
      setCheckoutState(prev => ({
        ...prev,
        error: result.message,
        loading: false
      }));
    }
  };

  // Load orders based on active tab
  useEffect(() => {
    const loadOrders = async () => {
      setListLoading(true);
      try {
        if (activeTab === 'pending') {
          const orders = await getPendingOrders(100);
          setPendingOrders(orders);
        } else if (activeTab === 'completed') {
          const orders = await getCompletedOrders(100);
          setCompletedOrders(orders);
        } else if (activeTab === 'refunded') {
          const orders = await getRefundedOrders(100);
          setRefundedOrders(orders);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setListLoading(false);
      }
    };

    if (activeTab !== 'search') {
      loadOrders();
    }
  }, [activeTab]);

  // Handle export to CSV
  const handleExportOrders = (orders: OrderDetails[], filename: string) => {
    const csv = exportOrdersToCSV(orders);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Checkout Management</h1>
        <p className="text-gray-600">
          Manage customer pickups, verify orders, and handle reimbursements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['search', 'pending', 'completed', 'refunded'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'search' && 'Order Lookup'}
            {tab === 'pending' && 'Pending Pickup'}
            {tab === 'completed' && 'Picked Up'}
            {tab === 'refunded' && 'Refunded'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'search' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Search Panel */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Order Lookup
                </CardTitle>
                <CardDescription>Search by order number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSearchOrder} className="space-y-3">
                  <Input
                    placeholder="Enter order number"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    disabled={checkoutState.loading}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={checkoutState.loading}
                  >
                    {checkoutState.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </form>

                {checkoutState.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{checkoutState.error}</AlertDescription>
                  </Alert>
                )}

                {checkoutState.success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {checkoutState.success}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Details Panel */}
          {checkoutState.order && (
            <div className="md:col-span-2 space-y-4">
              {/* Summary Card */}
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Order {checkoutState.order.order_reference}</CardTitle>
                      <CardDescription>
                        Created {new Date(checkoutState.order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${
                        checkoutState.order.status === 'picked_up'
                          ? 'bg-green-100 text-green-800'
                          : checkoutState.order.status === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {checkoutState.order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Customer Name</label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{checkoutState.order.customer_name}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Phone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{checkoutState.order.customer_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Total Amount</label>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-lg">
                          KES {checkoutState.order.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Payment Method</label>
                      <span className="font-medium capitalize">
                        {checkoutState.order.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="pt-4 border-t space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Items ({checkoutState.order.items.length})
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {checkoutState.order.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                          {item.product_name || item.name} x{item.quantity} - KES{' '}
                          {(item.price * item.quantity).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pickup Location */}
                  {checkoutState.order.pickup_location && (
                    <div className="pt-4 border-t space-y-1">
                      <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Pickup Location
                      </label>
                      <p className="text-sm text-gray-700">
                        {checkoutState.order.pickup_location}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t space-y-2">
                    {checkoutState.order.status !== 'picked_up' &&
                      checkoutState.order.status !== 'refunded' && (
                        <>
                          <Button
                            onClick={() => setShowCheckoutConfirm(true)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={checkoutState.loading}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Picked Up
                          </Button>
                          <Button
                            onClick={() => setShowReimbursementDialog(true)}
                            variant="outline"
                            className="w-full"
                            disabled={checkoutState.loading}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Process Reimbursement
                          </Button>
                        </>
                      )}

                    {checkoutState.order.status === 'picked_up' && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Order picked up on{' '}
                          {new Date(checkoutState.order.checked_out_at!).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {checkoutState.order.status === 'refunded' && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Order refunded: {checkoutState.order.refund_reason}
                        </span>
                      </div>
                    )}

                    <Button
                      onClick={() => setShowAuditLog(true)}
                      variant="ghost"
                      className="w-full"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      View Audit Trail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Pending Orders Tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Pickup</CardTitle>
              <CardDescription>Orders ready for customer pickup</CardDescription>
            </div>
            <Button
              onClick={() => handleExportOrders(pendingOrders, 'pending-orders')}
              variant="outline"
              size="sm"
              disabled={pendingOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : pendingOrders.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No pending orders</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSearchQuery(order.order_reference);
                      setActiveTab('search');
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{order.order_reference}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {order.total_amount.toLocaleString()}</p>
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed Orders Tab */}
      {activeTab === 'completed' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Picked Up Orders</CardTitle>
              <CardDescription>Orders that have been checked out</CardDescription>
            </div>
            <Button
              onClick={() => handleExportOrders(completedOrders, 'completed-orders')}
              variant="outline"
              size="sm"
              disabled={completedOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : completedOrders.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No completed orders</p>
            ) : (
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{order.order_reference}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {order.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.checked_out_at &&
                          new Date(order.checked_out_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refunded Orders Tab */}
      {activeTab === 'refunded' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Refunded Orders</CardTitle>
              <CardDescription>Orders that have been refunded</CardDescription>
            </div>
            <Button
              onClick={() => handleExportOrders(refundedOrders, 'refunded-orders')}
              variant="outline"
              size="sm"
              disabled={refundedOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : refundedOrders.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No refunded orders</p>
            ) : (
              <div className="space-y-3">
                {refundedOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{order.order_reference}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {order.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Reason: {order.refund_reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pickup</DialogTitle>
            <DialogDescription>
              Mark order {checkoutState.order?.order_reference} as picked up by customer?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                <strong>Customer:</strong> {checkoutState.order?.customer_name}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Amount:</strong> KES {checkoutState.order?.total_amount.toLocaleString()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCheckoutConfirm(false)}
              disabled={checkoutState.loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCheckout}
              disabled={checkoutState.loading}
            >
              {checkoutState.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Pickup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reimbursement Dialog */}
      <Dialog open={showReimbursementDialog} onOpenChange={setShowReimbursementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Reimbursement</DialogTitle>
            <DialogDescription>
              Handle refund for order {checkoutState.order?.order_reference}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-900">
                <strong>Amount:</strong> KES {checkoutState.order?.total_amount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select
                value={reimbursementForm.reason}
                onValueChange={reason =>
                  setReimbursementForm(prev => ({ ...prev, reason }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_cancelled">Customer Cancelled</SelectItem>
                  <SelectItem value="damaged_item">Damaged Item</SelectItem>
                  <SelectItem value="price_dispute">Price Dispute</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="customer_return">Customer Return</SelectItem>
                  <SelectItem value="defective">Defective</SelectItem>
                  <SelectItem value="duplicate_order">Duplicate Order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (Optional)</label>
              <Input
                type="number"
                placeholder="Leave empty for full refund"
                value={reimbursementForm.amount}
                onChange={e =>
                  setReimbursementForm(prev => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="w-full p-2 border rounded text-sm"
                placeholder="Additional notes..."
                rows={3}
                value={reimbursementForm.notes}
                onChange={e =>
                  setReimbursementForm(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReimbursementDialog(false)}
              disabled={checkoutState.loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReimbursement}
              disabled={checkoutState.loading || !reimbursementForm.reason}
            >
              {checkoutState.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
            <DialogDescription>
              Activity history for order {checkoutState.order?.order_reference}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {checkoutState.auditLogs.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No activity recorded</p>
            ) : (
              checkoutState.auditLogs.map(log => (
                <div key={log.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium capitalize">{log.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      by {log.admin_name}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-sm text-gray-700">Reason: {log.reason}</p>
                  )}
                  {log.amount && (
                    <p className="text-sm text-gray-700">Amount: KES {log.amount}</p>
                  )}
                  {log.notes && (
                    <p className="text-sm text-gray-600 italic">Note: {log.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAuditLog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickMartCheckout;
