import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, Building2, Handshake, ShoppingCart, Stethoscope } from 'lucide-react'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SectionPage } from './pages/SectionPage'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { DoctorsPage } from './pages/DoctorsPage'
import { DoctorsOverviewPage } from './pages/DoctorsOverviewPage'
import { DoctorDetailPage } from './pages/DoctorDetailPage'
import { PartnershipPage } from './pages/PartnershipPage'
import { PartnershipGroupPage } from './pages/PartnershipGroupPage'
import { SharedExpensesPage } from './pages/SharedExpensesPage'
import { VendorsPage, VendorDetailPage } from './pages/VendorsPage'
import { ProductsPage } from './pages/ProductsPage'
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage'
import { PurchaseOrderFormPage } from './pages/PurchaseOrderFormPage'
import { CompanySettingsPage } from './pages/CompanySettingsPage'
import { WarrantyInvoicesPage } from './pages/WarrantyInvoicesPage'
import { WarrantyInvoiceFormPage } from './pages/WarrantyInvoiceFormPage'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

export default function App() {
  return <QueryClientProvider client={queryClient}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
      <Route index element={<DashboardPage />} />
      <Route path="doctors" element={<DoctorsPage />} />
      <Route path="doctors/overview" element={<DoctorsOverviewPage />} />
      <Route path="doctors/:id" element={<DoctorDetailPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="vendors" element={<VendorsPage />} />
      <Route path="vendors/:id" element={<VendorDetailPage />} />
      <Route path="partnership" element={<PartnershipPage />} />
      <Route path="partnership/expenses" element={<SharedExpensesPage />} />
      <Route path="partnership/:group" element={<PartnershipGroupPage />} />
      <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="purchase-orders/:id" element={<PurchaseOrderFormPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="warranty" element={<WarrantyInvoicesPage />} />
      <Route path="warranty/new" element={<WarrantyInvoiceFormPage />} />
      <Route path="warranty/:id" element={<WarrantyInvoiceFormPage />} />
      <Route path="settings" element={<CompanySettingsPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></QueryClientProvider>
}


