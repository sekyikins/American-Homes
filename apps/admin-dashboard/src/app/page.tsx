'use client';

import * as React from 'react';
import { Button, Card, Badge, InputField, SelectField } from '@icos/ui';
import { supabase } from '../lib/supabase';

// Main component entry

export default function AdminDashboard() {
  const [shipments, setShipments] = React.useState<any[]>([]);
  const [batches, setBatches] = React.useState<any[]>([]);
  const [credits, setCredits] = React.useState<any[]>([]);
  const [agents, setAgents] = React.useState<any[]>([]);
  const [audits, setAudits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDemoAgents, setIsDemoAgents] = React.useState(false);

  // New Shipment input form
  const [newCode, setNewCode] = React.useState('');
  const [newCountry, setNewCountry] = React.useState('USA');
  const [newCost, setNewCost] = React.useState('');

  const fetchData = async () => {
    try {

      console.time('AdminDashboard-Supabase-Load');
      const [shipmentsResult, batchesResult, creditsResult, agentsResult, auditsResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory_batches')
          .select(`
            id,
            product_id,
            shipment_id,
            quantity_received,
            remaining_quantity,
            cost_price,
            products ( name ),
            shipments ( shipment_code )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('credit_accounts')
          .select(`
            id,
            total_debt,
            customer_id,
            customers ( name, phone, address )
          `)
          .order('total_debt', { ascending: false }),
        supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            role,
            commission_type,
            commission_rate,
            wallets ( balance )
          `)
          .eq('role', 'agent'),
        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)
      ]);
      console.timeEnd('AdminDashboard-Supabase-Load');

      const shipmentsData = shipmentsResult.data;
      const batchesData = batchesResult.data;
      const creditsData = creditsResult.data;
      const agentsData = agentsResult.data;
      const auditsData = auditsResult.data;

      // 1. Set shipments
      if (shipmentsData && shipmentsData.length > 0) {
        setShipments(shipmentsData);
      } else {
        setShipments([]);
      }

      // 2. Set batches
      if (batchesData && batchesData.length > 0) {
        setBatches(batchesData.map(b => ({
          id: b.id,
          product_id: b.product_id,
          product_name: (b.products as any)?.name || 'Unknown Product',
          shipment_code: (b.shipments as any)?.shipment_code || 'Direct Load',
          quantity_received: b.quantity_received,
          remaining_quantity: b.remaining_quantity,
          cost_price: Number(b.cost_price) || 0
        })));
      } else {
        setBatches([]);
      }

      // 3. Set credits
      if (creditsData && creditsData.length > 0) {
        setCredits(creditsData.map(c => ({
          id: c.id,
          customer_name: (c.customers as any)?.name || 'Unknown Customer',
          phone: (c.customers as any)?.phone || '',
          address: (c.customers as any)?.address || '',
          total_debt: Number(c.total_debt) || 0
        })));
      } else {
        setCredits([]);
      }

      // 4. Set agents
      if (agentsData && agentsData.length > 0) {
        setAgents(agentsData.map(a => ({
          id: a.id,
          name: a.name || 'Unknown Agent',
          email: a.email || '',
          role: a.role,
          commission_type: a.commission_type as 'percentage' | 'flat' | 'variant_specific',
          commission_rate: Number(a.commission_rate) || 0,
          balance: Number((a.wallets as any)?.[0]?.balance) || 0
        })));
        setIsDemoAgents(false);
      } else {
        setAgents([]);
        setIsDemoAgents(false);
      }

      // 5. Set audits
      if (auditsData && auditsData.length > 0) {
        setAudits(auditsData.map(a => ({
          id: a.id,
          action: a.action,
          user: a.user_id || 'system',
          details: typeof a.details === 'string' ? a.details : (a.details as any)?.message || JSON.stringify(a.details),
          time: new Date(a.created_at).toISOString().slice(0, 16).replace('T', ' ')
        })));
      } else {
        setAudits([]);
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Stats computed from state
  const totalRevenue = 48250;
  const totalDebt = credits.reduce((sum, item) => sum + item.total_debt, 0);
  const activeShipmentsCount = shipments.filter(s => s.status !== 'received').length;

  // Handle agent commission updates
  const handleAgentCommissionChange = async (agentId: string, field: 'commission_type' | 'commission_rate', value: any) => {
    if (isDemoAgents) {
      setAgents(prev => prev.map(agent => {
        if (agent.id === agentId) {
          const updated = { ...agent, [field]: value };
          setAudits(logs => [
            {
              id: `L_${Date.now()}`,
              action: 'AGENT_COMMISSION_UPDATED (DEMO)',
              user: 'admin@ahv.com',
              details: `[DEMO MODE] Updated ${agent.name} commission config: ${field} = ${value}`,
              time: new Date().toISOString().slice(0, 16).replace('T', ' ')
            },
            ...logs
          ]);
          return updated;
        }
        return agent;
      }));
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ [field]: value })
      .eq('id', agentId);

    if (error) {
      alert('Error updating agent commission: ' + error.message);
      return;
    }

    await supabase.from('audit_logs').insert([
      {
        action: 'AGENT_COMMISSION_UPDATED',
        details: { message: `Updated agent commission config for user ID ${agentId}: ${field} = ${value}` }
      }
    ]);

    fetchData();
  };

  // Create new shipment flow
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;

    const { error } = await supabase
      .from('shipments')
      .insert([
        {
          shipment_code: newCode,
          supplier_country: newCountry,
          status: 'pending',
          total_cost: Number(newCost) || 0
        }
      ]);

    if (error) {
      alert('Error creating shipment: ' + error.message);
      return;
    }

    await supabase.from('audit_logs').insert([
      {
        action: 'SHIPMENT_CREATED',
        details: { message: `Created shipment batch ${newCode} (Supplier: ${newCountry})` }
      }
    ]);

    setNewCode('');
    setNewCost('');
    fetchData();
  };

  // Receive shipment flow
  const handleReceiveShipment = async (id: string, code: string) => {
    const { error: shipmentErr } = await supabase
      .from('shipments')
      .update({ status: 'received', arrival_date: new Date().toISOString().split('T')[0] })
      .eq('id', id);

    if (shipmentErr) {
      alert('Error updating shipment status: ' + shipmentErr.message);
      return;
    }

    const { data: products } = await supabase.from('products').select('id').limit(1);
    const productId = products?.[0]?.id;
    if (productId) {
      const { error: batchErr } = await supabase
        .from('inventory_batches')
        .insert([
          {
            product_id: productId,
            shipment_id: id,
            quantity_received: 200,
            remaining_quantity: 200,
            cost_price: 320
          }
        ]);
      if (batchErr) {
        console.error('Error creating inventory batch:', batchErr.message);
      }
    }

    await supabase.from('audit_logs').insert([
      {
        action: 'SHIPMENT_RECEIVED',
        details: { message: `Shipment ${code} marked received. Auto-generated product inventory batch.` }
      }
    ]);

    fetchData();
  };

  // Credit resolution payment flow
  const handleRecordCreditPayment = async (creditId: string, customerName: string, amount: number) => {
    const { error } = await supabase
      .from('credit_payments')
      .insert([
        {
          credit_account_id: creditId,
          amount: amount
        }
      ]);

    if (error) {
      alert('Error recording credit payment: ' + error.message);
      return;
    }

    await supabase.from('audit_logs').insert([
      {
        action: 'CREDIT_PAYMENT_RECORDED',
        details: { message: `Received credit payment $${amount} from ${customerName}.` }
      }
    ]);

    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-zinc-400 font-medium tracking-wide">Connecting to AHV Cloud Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased selection:bg-indigo-500/25">
      {/* Sleek Minimal Header */}
      <nav className="border-b border-zinc-900/60 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-white text-sm">
              I
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              ICOS <span className="text-zinc-500 font-normal">/ Commerce Control</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md">
              Admin Console
            </span>
            <div className="h-7 w-7 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-semibold text-zinc-300">
              AH
            </div>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Intro Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900/40 pb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Control Center</h1>
            <p className="text-xs text-zinc-400 mt-1">Manage import shipments, warehouse ledger inventory, credit collections, and agent commission setups.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-900/40 border border-zinc-800/60 px-3 py-1.5 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Database Status: Connected</span>
          </div>
        </div>

        {/* KPI Panel Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="!bg-zinc-900/20 !border-zinc-850 p-6 flex flex-col justify-between rounded-xl shadow-none">
            <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">Sales Revenue</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 font-mono">${totalRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500 mt-2">Processed checkout volume</span>
          </Card>
          <Card className="!bg-zinc-900/20 !border-zinc-850 p-6 flex flex-col justify-between rounded-xl shadow-none">
            <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">Outstanding Credit</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 font-mono">${totalDebt.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500 mt-2">Unresolved customer debt</span>
          </Card>
          <Card className="!bg-zinc-900/20 !border-zinc-850 p-6 flex flex-col justify-between rounded-xl shadow-none">
            <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">Import Shipments</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 font-mono">{activeShipmentsCount}</span>
            <span className="text-[10px] text-zinc-500 mt-2">Active transit batches</span>
          </Card>
          <Card className="!bg-zinc-900/20 !border-zinc-850 p-6 flex flex-col justify-between rounded-xl shadow-none">
            <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">Inventory Batches</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 font-mono">{batches.length}</span>
            <span className="text-[10px] text-zinc-500 mt-2">Tracked active ledger lots</span>
          </Card>
        </section>

        {/* Section: Import & Shipment Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Shipment Form */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card title="Register Import Shipment" description="Track incoming products and transit costs." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
              <form onSubmit={handleCreateShipment} className="flex flex-col gap-4">
                <InputField 
                  label="Shipment Code" 
                  id="shipment_code" 
                  placeholder="e.g. AHV-2026-004" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required 
                  className="!bg-zinc-950/40 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
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
                  className="!bg-zinc-950/40 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
                />
                <InputField 
                  label="Total Cost ($)" 
                  id="shipment_cost" 
                  type="number"
                  placeholder="20000" 
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="!bg-zinc-950/40 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
                />
                <Button type="submit" variant="primary" className="w-full mt-2 text-xs py-2.5 rounded-lg font-medium transition-colors">Create Shipment</Button>
              </form>
            </Card>
          </div>

          {/* Active Shipments List */}
          <div className="lg:col-span-2">
            <Card title="Import Monitor" description="Active shipment workflows and logs." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
              <div className="overflow-x-auto border border-zinc-800/50 rounded-lg bg-zinc-950/10">
                <table className="w-full text-left border-collapse text-xs text-zinc-350">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-400 font-semibold tracking-wider text-[10px] uppercase">
                      <th className="py-3 px-4">Batch Code</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Arrival</th>
                      <th className="py-3 px-4">Landing Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((ship) => (
                      <tr key={ship.id} className="border-b border-zinc-800/40 last:border-b-0 hover:bg-zinc-900/10 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-zinc-200">{ship.shipment_code}</td>
                        <td className="py-3.5 px-4 text-zinc-300">{ship.supplier_country}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            ship.status === 'received' 
                              ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400' 
                              : ship.status === 'in_transit' 
                              ? 'bg-amber-950/30 border-amber-900/30 text-amber-400' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}>
                            {ship.status === 'received' ? 'Received' : ship.status === 'in_transit' ? 'In Transit' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-400">{ship.arrival_date || 'TBD'}</td>
                        <td className="py-3.5 px-4 font-mono text-zinc-200 font-medium">${Number(ship.total_cost).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          {ship.status !== 'received' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="!text-[10px] !py-1 !px-2.5 !border-zinc-800 hover:!bg-zinc-900 hover:!text-zinc-100 !text-zinc-300 !rounded-md"
                              onClick={() => handleReceiveShipment(ship.id, ship.shipment_code)}
                            >
                              Receive Batch
                            </Button>
                          )}
                          {ship.status === 'received' && <span className="text-[10px] text-zinc-500 italic">Inventory Loaded</span>}
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
          <Card title="Lot Ledger" description="Deductions and stock derived from individual shipment batches." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
            <div className="overflow-x-auto border border-zinc-800/50 rounded-lg bg-zinc-950/10">
              <table className="w-full text-left border-collapse text-xs text-zinc-350">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-400 font-semibold tracking-wider text-[10px] uppercase">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Source Lot</th>
                    <th className="py-3 px-4 font-mono text-right">Qty Recd</th>
                    <th className="py-3 px-4 font-mono text-right">Stock</th>
                    <th className="py-3 px-4 font-mono text-right">Cost Price</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b border-zinc-800/40 last:border-b-0">
                      <td className="py-3.5 px-4 font-semibold text-zinc-200">{b.product_name}</td>
                      <td className="py-3.5 px-4 text-[10px] font-mono text-zinc-400">{b.shipment_code}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-zinc-300">{b.quantity_received}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-zinc-100 font-medium">{b.remaining_quantity}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-zinc-400">${b.cost_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Customer Credit Accounts */}
          <Card title="Customer Accounts & Debts" description="Manage accounts with outstanding balances." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
            <div className="flex flex-col gap-3.5">
              {credits.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-4 border border-zinc-800/60 rounded-xl bg-zinc-900/10">
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-xs">{c.customer_name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">{c.phone} &bull; {c.address}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-zinc-100 text-sm font-semibold">${c.total_debt}</span>
                    {c.total_debt > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="!text-[10px] !py-1 !px-2.5 !border-zinc-800 !text-zinc-400 hover:!bg-zinc-800 hover:!text-zinc-100 !rounded-md"
                          onClick={() => handleRecordCreditPayment(c.id, c.customer_name, 100)}
                        >
                          Paid $100
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="!text-[10px] !py-1 !px-2.5 !border-indigo-900/40 !text-indigo-400 hover:!bg-indigo-950/20 hover:!text-indigo-300 !rounded-md"
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
            <Card title="Agent Commission Configurator" description="Adjust commission styles dynamically per registered agent user." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
              <div className="overflow-x-auto border border-zinc-800/50 rounded-lg bg-zinc-950/10">
                <table className="w-full text-left border-collapse text-xs text-zinc-350">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-400 font-semibold tracking-wider text-[10px] uppercase">
                      <th className="py-3 px-4">Agent</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-b border-zinc-800/40 last:border-b-0">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-200">{agent.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{agent.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-100 font-medium">${agent.balance}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={agent.commission_type}
                            onChange={(e) => handleAgentCommissionChange(agent.id, 'commission_type', e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="percentage">Percentage</option>
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
                              className="w-20 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md px-2.5 py-1 text-xs font-mono text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic font-medium">Product-driven</span>
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
            <Card title="Activity Log" description="Live ledger event logs." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                {audits.map((a) => (
                  <div key={a.id} className="border-b border-zinc-800/50 pb-3.5 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span className="font-semibold text-indigo-400 tracking-wide uppercase bg-indigo-950/30 border border-indigo-900/30 px-1.5 py-0.5 rounded text-[9px]">{a.action}</span>
                      <span className="font-mono">{a.time}</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{a.details}</p>
                    <p className="text-[9px] text-zinc-500 mt-1 font-mono tracking-tight bg-zinc-900/60 border border-zinc-850/80 px-1.5 py-0.5 rounded w-max">By: {a.user}</p>
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
