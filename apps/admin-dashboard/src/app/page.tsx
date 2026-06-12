'use client';

import * as React from 'react';
import { Button, Card, Badge, InputField, SelectField } from '@icos/ui';

// Mock initial data to populate the premium visual dashboard
const INITIAL_PRODUCTS = [
  { id: '1', name: 'Smart Inverter Fridge', category: 'Appliances', has_serial: true },
  { id: '2', name: 'Premium Sofa Set', category: 'Furniture', has_serial: false },
  { id: '3', name: 'UHD Smart TV 55"', category: 'Electronics', has_serial: true }
];

const INITIAL_SHIPMENTS = [
  { id: 'S1', shipment_code: 'AHV-2026-001', supplier_country: 'USA', status: 'received', arrival_date: '2026-05-15', total_cost: 15400 },
  { id: 'S2', shipment_code: 'AHV-2026-002', supplier_country: 'USA', status: 'in_transit', arrival_date: '2026-06-20', total_cost: 24000 },
  { id: 'S3', shipment_code: 'AHV-2026-003', supplier_country: 'China', status: 'pending', arrival_date: '2026-07-05', total_cost: 18500 }
];

const INITIAL_BATCHES = [
  { id: 'B1', product_id: '1', product_name: 'Smart Inverter Fridge', shipment_code: 'AHV-2026-001', quantity_received: 150, remaining_quantity: 120, cost_price: 350 },
  { id: 'B2', product_id: '2', product_name: 'Premium Sofa Set', shipment_code: 'AHV-2026-001', quantity_received: 80, remaining_quantity: 45, cost_price: 600 }
];

const INITIAL_CREDITS = [
  { id: 'C1', customer_name: 'Alice Johnson', phone: '+1234567890', total_debt: 1250, address: 'Houston, TX' },
  { id: 'C2', customer_name: 'Bob Miller', phone: '+1987654321', total_debt: 850, address: 'Austin, TX' }
];

const INITIAL_AGENTS = [
  { id: 'A1', name: 'David Carter', email: 'david@ahv.com', role: 'agent', commission_type: 'percentage', commission_rate: 0.05, balance: 420 },
  { id: 'A2', name: 'Sarah Connor', email: 'sarah@ahv.com', role: 'agent', commission_type: 'variant_specific', commission_rate: 0.00, balance: 180 }
];

const INITIAL_AUDITS = [
  { id: 'L1', action: 'BATCH_CREATED', user: 'admin@ahv.com', details: 'Added 150 Smart Inverter Fridges under batch B1', time: '2026-06-08 10:15' },
  { id: 'L2', action: 'ORDER_SYNC_SUCCESS', user: 'cashier1@ahv.com', details: 'Synced order POS-9912. Total value: $450', time: '2026-06-08 11:40' }
];

export default function AdminDashboard() {
  const [shipments, setShipments] = React.useState(INITIAL_SHIPMENTS);
  const [batches, setBatches] = React.useState(INITIAL_BATCHES);
  const [credits, setCredits] = React.useState(INITIAL_CREDITS);
  const [agents, setAgents] = React.useState(INITIAL_AGENTS);
  const [audits, setAudits] = React.useState(INITIAL_AUDITS);

  // Stats computed from state
  const totalRevenue = 48250;
  const totalDebt = credits.reduce((sum, item) => sum + item.total_debt, 0);
  const activeShipmentsCount = shipments.filter(s => s.status !== 'received').length;

  // New Shipment input form
  const [newCode, setNewCode] = React.useState('');
  const [newCountry, setNewCountry] = React.useState('USA');
  const [newCost, setNewCost] = React.useState('');

  // Handle agent commission updates
  const handleAgentCommissionChange = (agentId: string, field: 'commission_type' | 'commission_rate', value: any) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const updated = { ...agent, [field]: value };
        // Log auditing update
        setAudits(logs => [
          {
            id: `L_${Date.now()}`,
            action: 'AGENT_COMMISSION_UPDATED',
            user: 'admin@ahv.com',
            details: `Updated ${agent.name} commission config: ${field} = ${value}`,
            time: new Date().toISOString().slice(0, 16).replace('T', ' ')
          },
          ...logs
        ]);
        return updated;
      }
      return agent;
    }));
  };

  // Create new shipment mock flow
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;

    const newShipment = {
      id: `S${shipments.length + 1}`,
      shipment_code: newCode,
      supplier_country: newCountry,
      status: 'pending' as const,
      arrival_date: '',
      total_cost: Number(newCost) || 0,
      created_at: new Date().toISOString()
    };

    setShipments(prev => [...prev, newShipment]);
    setAudits(logs => [
      {
        id: `L_${Date.now()}`,
        action: 'SHIPMENT_CREATED',
        user: 'admin@ahv.com',
        details: `Created shipment batch ${newCode} (Supplier: ${newCountry})`,
        time: new Date().toISOString().slice(0, 16).replace('T', ' ')
      },
      ...logs
    ]);

    setNewCode('');
    setNewCost('');
  };

  // Receive shipment mock flow
  const handleReceiveShipment = (id: string, code: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: 'received' as const, arrival_date: new Date().toISOString().split('T')[0] } : s));
    
    // Simulate auto-generating batch inventory
    const newBatch = {
      id: `B${batches.length + 1}`,
      product_id: '1',
      product_name: 'Smart Inverter Fridge',
      shipment_code: code,
      quantity_received: 200,
      remaining_quantity: 200,
      cost_price: 320
    };

    setBatches(prev => [...prev, newBatch]);
    setAudits(logs => [
      {
        id: `L_${Date.now()}`,
        action: 'SHIPMENT_RECEIVED',
        user: 'admin@ahv.com',
        details: `Shipment ${code} marked received. Auto-generated product inventory batch ${newBatch.id}`,
        time: new Date().toISOString().slice(0, 16).replace('T', ' ')
      },
      ...logs
    ]);
  };

  // Credit resolution payment mock
  const handleRecordCreditPayment = (creditId: string, customerName: string, amount: number) => {
    setCredits(prev => prev.map(c => {
      if (c.id === creditId) {
        const updatedDebt = Math.max(0, c.total_debt - amount);
        setAudits(logs => [
          {
            id: `L_${Date.now()}`,
            action: 'CREDIT_PAYMENT_RECORDED',
            user: 'cashier1@ahv.com',
            details: `Received credit payment $${amount} from ${customerName}. Remaining debt: $${updatedDebt}`,
            time: new Date().toISOString().slice(0, 16).replace('T', ' ')
          },
          ...logs
        ]);
        return { ...c, total_debt: updatedDebt };
      }
      return c;
    }));
  };

  return (
    <div className="min-height-screen bg-slate-900 text-slate-100 font-sans">
      {/* Premium Gradient Header Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/20">I</div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">ICOS Operating System</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold bg-indigo-950/40 text-indigo-400 border border-indigo-900/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></span>
              Admin Dashboard
            </span>
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">AH</div>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* KPI Panel Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="!bg-slate-950 !border-slate-800 p-6 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono">${totalRevenue.toLocaleString()}</span>
            <Badge type="success" className="mt-4 w-fit">Cash & Cards</Badge>
          </Card>
          <Card className="!bg-slate-950 !border-slate-800 p-6 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Credits / Debt</span>
            <span className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">${totalDebt.toLocaleString()}</span>
            <Badge type="error" className="mt-4 w-fit">Requires Collection</Badge>
          </Card>
          <Card className="!bg-slate-950 !border-slate-800 p-6 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Import Shipments</span>
            <span className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">{activeShipmentsCount}</span>
            <Badge type="info" className="mt-4 w-fit">In Transit / Pending</Badge>
          </Card>
          <Card className="!bg-slate-950 !border-slate-800 p-6 flex flex-col justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Current Inventory Batches</span>
            <span className="text-3xl font-extrabold text-violet-400 mt-2 font-mono">{batches.length}</span>
            <Badge type="default" className="mt-4 w-fit">Batch Ledger active</Badge>
          </Card>
        </section>

        {/* Section: Import & Shipment Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Shipment Form */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card title="Add Import Shipment" description="Initiate a new supplier import batch tracking code." className="!bg-slate-950 !border-slate-800">
              <form onSubmit={handleCreateShipment} className="flex flex-col gap-4">
                <InputField 
                  label="Shipment Code" 
                  id="shipment_code" 
                  placeholder="e.g. AHV-2026-004" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required 
                  className="!bg-slate-900 !border-slate-800 text-white"
                />
                <SelectField 
                  label="Supplier Country" 
                  id="supplier_country" 
                  options={[
                    { value: 'USA', label: 'United States (USA)' },
                    { value: 'China', label: 'China' },
                    { value: 'Germany', label: 'Germany' }
                  ]}
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="!bg-slate-900 !border-slate-800 text-white"
                />
                <InputField 
                  label="Total Shipment Cost ($)" 
                  id="shipment_cost" 
                  type="number"
                  placeholder="20000" 
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="!bg-slate-900 !border-slate-800 text-white"
                />
                <Button type="submit" variant="primary" className="w-full mt-2">Create Shipment</Button>
              </form>
            </Card>
          </div>

          {/* Active Shipments List */}
          <div className="lg:col-span-2">
            <Card title="Shipment Workflow Monitor" description="Real-time import batches transit updates." className="!bg-slate-950 !border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Shipment Code</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Arrival Date</th>
                      <th className="py-3 px-4">Total Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((ship) => (
                      <tr key={ship.id} className="border-b border-slate-900 hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{ship.shipment_code}</td>
                        <td className="py-3.5 px-4">{ship.supplier_country}</td>
                        <td className="py-3.5 px-4">
                          <Badge type={ship.status === 'received' ? 'success' : ship.status === 'in_transit' ? 'warning' : 'default'}>
                            {ship.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">{ship.arrival_date || 'TBD'}</td>
                        <td className="py-3.5 px-4 font-mono">${ship.total_cost.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          {ship.status !== 'received' && (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleReceiveShipment(ship.id, ship.shipment_code)}
                            >
                              Receive Batch
                            </Button>
                          )}
                          {ship.status === 'received' && <span className="text-xs text-slate-500 italic">Inventory Loaded</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Section: Inventory Ledger & Customer Credit */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Inventory Batches Ledger */}
          <Card title="Current Batch Inventory Ledger" description="Deductions and stock derived from batches." className="!bg-slate-950 !border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Source Shipment</th>
                    <th className="py-3 px-4 font-mono text-right">Qty Received</th>
                    <th className="py-3 px-4 font-mono text-right">Remaining Stock</th>
                    <th className="py-3 px-4 font-mono text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b border-slate-900">
                      <td className="py-3 px-4 font-semibold text-white">{b.product_name}</td>
                      <td className="py-3 px-4 text-xs font-mono">{b.shipment_code}</td>
                      <td className="py-3 px-4 font-mono text-right">{b.quantity_received}</td>
                      <td className="py-3 px-4 font-mono text-right text-cyan-400 font-semibold">{b.remaining_quantity}</td>
                      <td className="py-3 px-4 font-mono text-right">${b.cost_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Customer Credit Accounts */}
          <Card title="Customer Credit sales Accounts" description="Track unpaid debt collections." className="!bg-slate-950 !border-slate-800">
            <div className="flex flex-col gap-4">
              {credits.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-4 border border-slate-800 rounded-xl bg-slate-950">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.customer_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{c.phone} | {c.address}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-rose-400 font-bold text-base">${c.total_debt}</span>
                    {c.total_debt > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRecordCreditPayment(c.id, c.customer_name, 100)}
                        >
                          Paid $100
                        </Button>
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => handleRecordCreditPayment(c.id, c.customer_name, c.total_debt)}
                        >
                          Clear Debt
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Section: Agent Commission Configuration */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card title="Agent Wallets & Commission Configurator" description="Configure commission type (Percentage, Flat, or Variant-Specific) dynamically per agent." className="!bg-slate-950 !border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Agent Name</th>
                      <th className="py-3 px-4">Wallet Balance</th>
                      <th className="py-3 px-4">Commission Type</th>
                      <th className="py-3 px-4">Commission Rate / Flat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-b border-slate-900">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{agent.name}</div>
                          <div className="text-xs text-slate-500 font-normal">{agent.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">${agent.balance}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={agent.commission_type}
                            onChange={(e) => handleAgentCommissionChange(agent.id, 'commission_type', e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="percentage">Percentage (Rate)</option>
                            <option value="flat">Flat Commission</option>
                            <option value="variant_specific">Variant Specific</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          {agent.commission_type !== 'variant_specific' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={agent.commission_rate}
                              onChange={(e) => handleAgentCommissionChange(agent.id, 'commission_rate', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs text-right font-mono"
                            />
                          ) : (
                            <span className="text-xs text-slate-500 italic">Driven by product variant setting</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Audit Logs panel */}
          <div className="lg:col-span-1">
            <Card title="System Audit Logs" description="Real-time ledger audit trail logs." className="!bg-slate-950 !border-slate-800">
              <div className="flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1">
                {audits.map((a) => (
                  <div key={a.id} className="border-b border-slate-900 pb-3 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <Badge type={a.action.includes('SUCCESS') || a.action.includes('RECEIVED') ? 'success' : 'info'} className="!text-[10px]">
                        {a.action}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-mono">{a.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{a.details}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">By: {a.user}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
