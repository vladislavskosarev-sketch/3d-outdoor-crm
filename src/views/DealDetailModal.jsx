import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Trash2, Save, Printer, Compass, Info, Calculator } from 'lucide-react';

export default function DealDetailModal({ dealId, onClose }) {
  const getLocalNum = (key, fallback) => {
    const val = localStorage.getItem(key);
    return val !== null ? Number(val) : fallback;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deal, setDeal] = useState(null);
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Base deal states
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(0);
  const [stage, setStage] = useState('lead');
  const [dealType, setDealType] = useState('general');
  const [clientId, setClientId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [notes, setNotes] = useState('');
  const [prepayment, setPrepayment] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [contractorName, setContractorName] = useState('');
  const [contractorCost, setContractorCost] = useState(0);

  // 3D Print Job States
  const [printJob, setPrintJob] = useState(null);
  const [materialType, setMaterialType] = useState('PLA');
  const [color, setColor] = useState('Black');
  const [weightGrams, setWeightGrams] = useState(0);
  const [printTimeHours, setPrintTimeHours] = useState(0);
  const [printerName, setPrinterName] = useState('Printer #1');
  const [printStatus, setPrintStatus] = useState('queued');

  // 3D Calculator presets
  const [calcMatRate, setCalcMatRate] = useState(getLocalNum('default_calc_mat_rate_pla', 1500)); // RUB per kg
  const [calcPrinterPrice, setCalcPrinterPrice] = useState(getLocalNum('default_calc_printer_price', 40000)); // RUB
  const [calcPrinterLifespan, setCalcPrinterLifespan] = useState(getLocalNum('default_calc_printer_lifespan', 8000)); // hours
  const [calcPrinterPower, setCalcPrinterPower] = useState(getLocalNum('default_calc_printer_power', 350)); // Watts
  const [calcElectricityRate, setCalcElectricityRate] = useState(getLocalNum('default_calc_electricity_rate', 6)); // RUB/kWh
  const [calcPostHours, setCalcPostHours] = useState(0); // hours
  const [calcPostRate, setCalcPostRate] = useState(getLocalNum('default_calc_post_rate', 300)); // RUB per hour
  const [calcMarkup, setCalcMarkup] = useState(getLocalNum('default_calc_markup', 50)); // % markup
  const [printCalcResult, setPrintCalcResult] = useState(0);

  // Outdoor Ads Job States
  const [outdoorJob, setOutdoorJob] = useState(null);
  const [adType, setAdType] = useState('Banner');
  const [widthM, setWidthM] = useState(0);
  const [heightM, setHeightM] = useState(0);
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [mountingRequired, setMountingRequired] = useState(false);
  const [installationAddress, setInstallationAddress] = useState('');
  const [outdoorStatus, setOutdoorStatus] = useState('design');

  // Outdoor Calculator states
  const [outdoorCalcType, setOutdoorCalcType] = useState('banner'); // 'banner' or 'lightbox'
  const [calcMatSqmRate, setCalcMatSqmRate] = useState(getLocalNum('default_calc_mat_sqm_rate', 600)); // Material price per sqm (RUB)
  const [calcWeldRate, setCalcWeldRate] = useState(getLocalNum('default_calc_weld_rate', 100)); // Edge welding per linear meter (RUB)
  const [calcEyeletsCount, setCalcEyeletsCount] = useState(0);
  const [calcEyeletPrice, setCalcEyeletPrice] = useState(getLocalNum('default_calc_eyelet_price', 15)); // per piece
  const [calcFrameRequired, setCalcFrameRequired] = useState(false);
  const [calcFrameRate, setCalcFrameRate] = useState(getLocalNum('default_calc_frame_rate', 300)); // per meter
  const [calcProfileRate, setCalcProfileRate] = useState(getLocalNum('default_calc_profile_rate', 800)); // per meter
  const [calcLedCount, setCalcLedCount] = useState(0);
  const [calcLedPrice, setCalcLedPrice] = useState(getLocalNum('default_calc_led_price', 45)); // per module
  const [calcPowerSupplyCount, setCalcPowerSupplyCount] = useState(0);
  const [calcPowerSupplyPrice, setCalcPowerSupplyPrice] = useState(getLocalNum('default_calc_power_supply_price', 1200)); // per unit
  const [calcDesignFee, setCalcDesignFee] = useState(getLocalNum('default_calc_design_fee', 2000)); // Design/mounting flat fee
  const [calcOutdoorMarkup, setCalcOutdoorMarkup] = useState(getLocalNum('default_calc_outdoor_markup', 50)); // % markup
  const [outdoorCalcResult, setOutdoorCalcResult] = useState(0);

  // Scrap & Waste States
  const [scrapCost, setScrapCost] = useState(0);
  const [scrapLogs, setScrapLogs] = useState([]);
  const [showAddScrap, setShowAddScrap] = useState(false);
  const [manualScrap, setManualScrap] = useState({ materialId: '', quantity: '', reason: '', unit: 'pcs' });


  const loadDealData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch main deal
      const { data: dealData, error: dealErr } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (dealErr) throw dealErr;
      setDeal(dealData);
      setTitle(dealData.title || '');
      setCost(dealData.cost || 0);
      setStage(dealData.stage || 'lead');
      setDealType(dealData.deal_type || 'general');
      setClientId(dealData.client_id || '');
      setManagerId(dealData.assigned_manager || '');
      setNotes(dealData.notes || '');
      setPrepayment(dealData.prepayment || 0);
      setPaymentStatus(dealData.payment_status || 'unpaid');
      setIsOutsourced(!!dealData.is_outsourced);
      setContractorName(dealData.contractor_name || '');
      setContractorCost(dealData.contractor_cost || 0);

      // 2. Fetch Client list
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      setClients(clientsData || []);

      // 3. Fetch Managers list
      const { data: managersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('role', 'pending')
        .neq('role', 'disabled');
      setManagers(managersData || []);

      // 4. Fetch 3D print job details if 3D printing deal
      if (dealData.deal_type === '3d_printing') {
        const { data: printData, error: printErr } = await supabase
          .from('jobs_3d_print')
          .select('*')
          .eq('deal_id', dealId)
          .maybeSingle();

        if (printErr) throw printErr;

        if (printData) {
          setPrintJob(printData);
          setMaterialType(printData.material_type || 'PLA');
          setColor(printData.color || 'Black');
          setWeightGrams(Number(printData.weight_grams) || 0);
          setPrintTimeHours(Number(printData.print_time_hours) || 0);
          setPrinterName(printData.printer_name || 'Printer #1');
          setPrintStatus(printData.status || 'queued');
          
          // Pre-populate calculator input variables if settings exists
          if (printData.settings_json) {
            const s = printData.settings_json;
            if (s.calcMatRate !== undefined) setCalcMatRate(s.calcMatRate);
            if (s.calcPrinterPrice !== undefined) setCalcPrinterPrice(s.calcPrinterPrice);
            if (s.calcPrinterLifespan !== undefined) setCalcPrinterLifespan(s.calcPrinterLifespan);
            if (s.calcPrinterPower !== undefined) setCalcPrinterPower(s.calcPrinterPower);
            if (s.calcElectricityRate !== undefined) setCalcElectricityRate(s.calcElectricityRate);
            if (s.calcPostHours !== undefined) setCalcPostHours(s.calcPostHours);
            if (s.calcPostRate !== undefined) setCalcPostRate(s.calcPostRate);
            if (s.calcMarkup !== undefined) setCalcMarkup(s.calcMarkup);
          }
        } else {
          // If sub-row doesn't exist, create it
          await supabase.from('jobs_3d_print').insert([{ deal_id: dealId }]);
          loadDealData();
        }
      }

      // 5. Fetch Outdoor ad job details if Outdoor advertising deal
      if (dealData.deal_type === 'outdoor_ads') {
        const { data: outdoorData, error: outdoorErr } = await supabase
          .from('jobs_outdoor_ads')
          .select('*')
          .eq('deal_id', dealId)
          .maybeSingle();

        if (outdoorErr) throw outdoorErr;

        if (outdoorData) {
          setOutdoorJob(outdoorData);
          setAdType(outdoorData.ad_type || 'Banner');
          setWidthM(Number(outdoorData.width_m) || 0);
          setHeightM(Number(outdoorData.height_m) || 0);
          setMaterialsUsed(outdoorData.materials_used || '');
          setMountingRequired(!!outdoorData.mounting_required);
          setInstallationAddress(outdoorData.installation_address || '');
          setOutdoorStatus(outdoorData.status || 'design');

          if (outdoorData.settings_json) {
            const s = outdoorData.settings_json;
            if (s.outdoorCalcType) setOutdoorCalcType(s.outdoorCalcType);
            if (s.calcMatSqmRate !== undefined) setCalcMatSqmRate(s.calcMatSqmRate);
            if (s.calcWeldRate !== undefined) setCalcWeldRate(s.calcWeldRate);
            if (s.calcEyeletsCount !== undefined) setCalcEyeletsCount(s.calcEyeletsCount);
            if (s.calcEyeletPrice !== undefined) setCalcEyeletPrice(s.calcEyeletPrice);
            if (s.calcFrameRequired !== undefined) setCalcFrameRequired(s.calcFrameRequired);
            if (s.calcFrameRate !== undefined) setCalcFrameRate(s.calcFrameRate);
            if (s.calcProfileRate !== undefined) setCalcProfileRate(s.calcProfileRate);
            if (s.calcLedCount !== undefined) setCalcLedCount(s.calcLedCount);
            if (s.calcLedPrice !== undefined) setCalcLedPrice(s.calcLedPrice);
            if (s.calcPowerSupplyCount !== undefined) setCalcPowerSupplyCount(s.calcPowerSupplyCount);
            if (s.calcPowerSupplyPrice !== undefined) setCalcPowerSupplyPrice(s.calcPowerSupplyPrice);
            if (s.calcDesignFee !== undefined) setCalcDesignFee(s.calcDesignFee);
            if (s.calcOutdoorMarkup !== undefined) setCalcOutdoorMarkup(s.calcOutdoorMarkup);
          }
        } else {
          // If sub-row doesn't exist, create it
          await supabase.from('jobs_outdoor_ads').insert([{ deal_id: dealId }]);
          loadDealData();
        }
      }

      // 6. Fetch warehouse items
      try {
        const { data: invData } = await supabase
          .from('inventory_items')
          .select('*');
        setInventory(invData || []);
      } catch (e) {
        console.warn('Inventory table not available:', e);
        setInventory([]);
      }

      // 7. Fetch scrap logs
      try {
        setScrapCost(dealData.scrap_cost || 0);
        const { data: scrapData, error: scrapErr } = await supabase
          .from('scrap_logs')
          .select('*')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });
        if (scrapErr) throw scrapErr;
        setScrapLogs(scrapData || []);
      } catch (e) {
        console.warn('Scrap logs not available:', e);
        setScrapLogs([]);
      }

    } catch (err) {
      console.error('Error loading deal details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealData();
  }, [dealId]);

  const fetchScrapOnly = async () => {
    if (!supabase) return;
    try {
      const { data: dealData } = await supabase
        .from('deals')
        .select('scrap_cost')
        .eq('id', dealId)
        .single();
      if (dealData) {
        setScrapCost(dealData.scrap_cost || 0);
      }
      const { data: scrapData } = await supabase
        .from('scrap_logs')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      setScrapLogs(scrapData || []);
    } catch (err) {
      console.error('Error fetching scrap data:', err);
    }
  };

  const handleSaveManualScrap = async () => {
    if (!manualScrap.materialId) {
      alert('Пожалуйста, выберите материал.');
      return;
    }
    const qty = Number(manualScrap.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Пожалуйста, укажите корректное количество.');
      return;
    }
    if (!manualScrap.reason.trim()) {
      alert('Пожалуйста, укажите причину брака.');
      return;
    }

    const selectedItem = inventory.find(i => i.id === manualScrap.materialId);
    if (!selectedItem) {
      alert('Выбранный материал не найден.');
      return;
    }

    const costOfScrap = qty * selectedItem.price_per_unit;

    try {
      const { error } = await supabase
        .from('scrap_logs')
        .insert([{
          deal_id: dealId,
          material_id: manualScrap.materialId,
          material_name: selectedItem.name,
          quantity: qty,
          unit: selectedItem.unit,
          cost: costOfScrap,
          reason: manualScrap.reason.trim()
        }]);

      if (error) throw error;

      // Reset form and refresh scrap data
      setShowAddScrap(false);
      setManualScrap({ materialId: '', quantity: '', reason: '', unit: 'pcs' });
      await fetchScrapOnly();
      
      // Update local inventories in parent/modal
      const { data: invData } = await supabase.from('inventory_items').select('*');
      setInventory(invData || []);

    } catch (err) {
      console.error('Error logging manual scrap:', err);
      alert('Не удалось зарегистрировать брак: ' + err.message);
    }
  };

  const handleDeleteScrap = async (logId) => {
    if (!confirm('Вы действительно хотите удалить эту запись о браке? Списанные материалы будут возвращены на склад.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scrap_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      await fetchScrapOnly();

      // Refresh inventory stock
      const { data: invData } = await supabase.from('inventory_items').select('*');
      setInventory(invData || []);
    } catch (err) {
      console.error('Error deleting scrap log:', err);
      alert('Не удалось удалить запись о браке: ' + err.message);
    }
  };

  // Handle 3D print calculations in real-time
  useEffect(() => {
    const matCost = (weightGrams / 1000) * calcMatRate;
    const amortRate = calcPrinterLifespan > 0 ? (calcPrinterPrice / calcPrinterLifespan) : 0;
    const elecRate = (calcPrinterPower / 1000) * calcElectricityRate;
    const printCost = printTimeHours * (amortRate + elecRate);
    const postCost = calcPostHours * calcPostRate;
    const base = matCost + printCost + postCost;
    const finalPrice = base * (1 + calcMarkup / 100);
    setPrintCalcResult(Math.round(finalPrice));
  }, [weightGrams, printTimeHours, calcMatRate, calcPrinterPrice, calcPrinterLifespan, calcPrinterPower, calcElectricityRate, calcPostHours, calcPostRate, calcMarkup]);

  // Handle Outdoor ads calculations in real-time
  useEffect(() => {
    const area = widthM * heightM;
    const perimeter = 2 * (widthM + heightM);
    let base = 0;
    
    if (outdoorCalcType === 'banner') {
      const matCost = area * calcMatSqmRate;
      const weldCost = perimeter * calcWeldRate;
      const eyeletsCost = calcEyeletsCount * calcEyeletPrice;
      const frameCost = calcFrameRequired ? (perimeter * calcFrameRate) : 0;
      base = matCost + weldCost + eyeletsCost + frameCost;
    } else {
      // lightbox
      const faceCost = area * calcMatSqmRate;
      const profileCost = perimeter * calcProfileRate;
      const ledsCost = calcLedCount * calcLedPrice;
      const psCost = calcPowerSupplyCount * calcPowerSupplyPrice;
      const frameCost = calcFrameRequired ? (perimeter * calcFrameRate) : 0;
      base = faceCost + profileCost + ledsCost + psCost + frameCost;
    }
    
    const finalPrice = base * (1 + calcOutdoorMarkup / 100) + calcDesignFee;
    setOutdoorCalcResult(Math.round(finalPrice));
  }, [
    widthM, heightM, outdoorCalcType, calcMatSqmRate, calcWeldRate, 
    calcEyeletsCount, calcEyeletPrice, calcFrameRequired, calcFrameRate, 
    calcProfileRate, calcLedCount, calcLedPrice, calcPowerSupplyCount, 
    calcPowerSupplyPrice, calcDesignFee, calcOutdoorMarkup
  ]);

  const handleApplyPrintPrice = () => {
    setCost(printCalcResult);
  };

  const handleApplyOutdoorPrice = () => {
    setCost(outdoorCalcResult);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update primary deal details
      const { error: dealErr } = await supabase
        .from('deals')
        .update({
          title,
          cost: Number(cost),
          stage,
          deal_type: dealType,
          client_id: clientId || null,
          assigned_manager: managerId || null,
          notes,
          prepayment: Number(prepayment),
          payment_status: paymentStatus,
          is_outsourced: isOutsourced,
          contractor_name: isOutsourced ? contractorName.trim() || null : null,
          contractor_cost: isOutsourced ? Number(contractorCost) : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (dealErr) throw dealErr;

      // 2. Save 3D print sub-table if active
      if (dealType === '3d_printing' && printJob) {
        const { error: printErr } = await supabase
          .from('jobs_3d_print')
          .update({
            material_type: materialType,
            color,
            weight_grams: Number(weightGrams),
            print_time_hours: Number(printTimeHours),
            printer_name: printerName,
            status: printStatus,
            calculated_cost: printCalcResult,
            settings_json: {
              calcMatRate,
              calcPrinterPrice,
              calcPrinterLifespan,
              calcPrinterPower,
              calcElectricityRate,
              calcPostHours,
              calcPostRate,
              calcMarkup
            }
          })
          .eq('deal_id', dealId);

        if (printErr) throw printErr;
      }

      // 3. Save Outdoor ads sub-table if active
      if (dealType === 'outdoor_ads' && outdoorJob) {
        const { error: outdoorErr } = await supabase
          .from('jobs_outdoor_ads')
          .update({
            ad_type: adType,
            width_m: Number(widthM),
            height_m: Number(heightM),
            materials_used: materialsUsed,
            mounting_required: mountingRequired,
            installation_address: mountingRequired ? installationAddress : null,
            status: outdoorStatus,
            calculated_cost: outdoorCalcResult,
            settings_json: {
              outdoorCalcType,
              calcMatSqmRate,
              calcWeldRate,
              calcEyeletsCount,
              calcEyeletPrice,
              calcFrameRequired,
              calcFrameRate,
              calcProfileRate,
              calcLedCount,
              calcLedPrice,
              calcPowerSupplyCount,
              calcPowerSupplyPrice,
              calcDesignFee,
              calcOutdoorMarkup
            }
          })
          .eq('deal_id', dealId);

        if (outdoorErr) throw outdoorErr;
      }

      onClose();
    } catch (err) {
      console.error('Save deal error:', err);
      alert('Не удалось сохранить изменения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Вы действительно хотите удалить эту сделку безвозвратно? Все связанные производственные задания будут удалены.')) {
      try {
        const { error } = await supabase
          .from('deals')
          .delete()
          .eq('id', dealId);

        if (error) throw error;
        onClose();
      } catch (err) {
        console.error('Delete deal error:', err);
        alert('Ошибка удаления сделки.');
      }
    }
  };

  const getPresetValues = (mat) => {
    switch (mat) {
      case 'PLA': return { matRate: getLocalNum('default_calc_mat_rate_pla', 1500) };
      case 'PETG': return { matRate: getLocalNum('default_calc_mat_rate_petg', 1800) };
      case 'ABS': return { matRate: getLocalNum('default_calc_mat_rate_abs', 1700) };
      case 'TPU': return { matRate: getLocalNum('default_calc_mat_rate_tpu', 3500) };
      case 'Nylon': return { matRate: getLocalNum('default_calc_mat_rate_nylon', 4000) };
      default: return { matRate: getLocalNum('default_calc_mat_rate_pla', 1500) };
    }
  };


  const handleMaterialChange = (mat) => {
    setMaterialType(mat);
    const presets = getPresetValues(mat);
    setCalcMatRate(presets.matRate);
  };

  const handlePrintTechCard = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Всплывающее окно заблокировано браузером/системой.');
      return;
    }
    
    const clientName = clients.find(c => c.id === clientId)?.name || 'Не указан';
    const managerName = managers.find(m => m.id === managerId)?.full_name || 'Не назначен';
    
    let specHtml = '';
    if (dealType === '3d_printing') {
      specHtml = `
        <div class="spec-section">
          <h3>Параметры 3D-печати</h3>
          <table>
            <tr><td><b>Материал (Пластик):</b></td><td>${materialType}</td></tr>
            <tr><td><b>Цвет:</b></td><td>${color || 'Черный'}</td></tr>
            <tr><td><b>Вес детали:</b></td><td>${weightGrams} грамм</td></tr>
            <tr><td><b>Время печати:</b></td><td>${printTimeHours} часов</td></tr>
            <tr><td><b>Модель принтера:</b></td><td>${printerName || 'Не указан'}</td></tr>
            <tr><td><b>Статус:</b></td><td>${printStatus === 'queued' ? 'В очереди' : 
                                            printStatus === 'printing' ? 'Печатается' : 
                                            printStatus === 'finished' ? 'Завершено успешно' : 
                                            printStatus === 'failed' ? 'Брак / Сбой' : 
                                            printStatus === 'post_processing' ? 'Постобработка' : printStatus}</td></tr>
          </table>
        </div>
      `;
    } else if (dealType === 'outdoor_ads') {
      specHtml = `
        <div class="spec-section">
          <h3>Параметры конструкции</h3>
          <table>
            <tr><td><b>Тип конструкции:</b></td><td>${adType}</td></tr>
            <tr><td><b>Ширина:</b></td><td>${widthM} м</td></tr>
            <tr><td><b>Высота:</b></td><td>${heightM} м</td></tr>
            <tr><td><b>Площадь:</b></td><td>${Number(widthM * heightM).toFixed(2)} м² (Периметр: ${Number(2 * (widthM + heightM)).toFixed(2)} м)</td></tr>
            <tr><td><b>Используемые материалы:</b></td><td>${materialsUsed || 'Не указаны'}</td></tr>
            <tr><td><b>Монтаж требуется:</b></td><td>${mountingRequired ? 'Да' : 'Нет'}</td></tr>
            ${mountingRequired ? `<tr><td><b>Адрес монтажа:</b></td><td>${installationAddress || 'Не указан'}</td></tr>` : ''}
            <tr><td><b>Этап производства:</b></td><td>${outdoorStatus === 'design' ? 'Дизайн / Согласование' : 
                                            outdoorStatus === 'printing' ? 'Печать' : 
                                            outdoorStatus === 'assembly' ? 'Сборка' : 
                                            outdoorStatus === 'installation' ? 'Доставка и Монтаж' : 
                                            outdoorStatus === 'completed' ? 'Сдано' : outdoorStatus}</td></tr>
          </table>
        </div>
      `;
    } else {
      specHtml = `<p>Общая сделка без производственных параметров.</p>`;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Технологическая карта - ${title}</title>
          <style>
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header h1 {
              margin: 0 0 6px 0;
              font-size: 26px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.02em;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 24px;
              margin-bottom: 24px;
              font-size: 14px;
            }
            .meta-item {
              padding: 6px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .meta-item b {
              color: #64748b;
              font-weight: 600;
            }
            .spec-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .spec-section h3 {
              margin-top: 0;
              margin-bottom: 16px;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 6px;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td {
              padding: 8px 0;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
            }
            td:first-child {
              width: 40%;
              color: #64748b;
              font-weight: 600;
            }
            td:last-child {
              color: #0f172a;
              font-weight: 500;
            }
            .notes-section {
              margin-bottom: 40px;
            }
            .notes-section h3 {
              font-size: 16px;
              margin-bottom: 10px;
              color: #0f172a;
            }
            .notes-box {
              border: 1.5px dashed #94a3b8;
              border-radius: 6px;
              padding: 16px;
              min-height: 100px;
              white-space: pre-wrap;
              background: #fff;
              font-size: 13px;
              color: #334155;
            }
            .footer-signature {
              margin-top: 80px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 60px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #475569;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Печать</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #64748b; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px; font-size: 13px;">Закрыть</button>
          </div>
          
          <div class="header">
            <h1>Технологическая карта заказа</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">ID: ${dealId.slice(0, 8).toUpperCase()} | Дата выпуска: ${new Date().toLocaleDateString('ru-RU')}</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><b>Название заказа:</b> ${title}</div>
            <div class="meta-item"><b>Тип:</b> ${dealType === '3d_printing' ? '3D Печать' : dealType === 'outdoor_ads' ? 'Наружная реклама' : 'Общий'}</div>
            <div class="meta-item"><b>Клиент:</b> ${clientName}</div>
            <div class="meta-item"><b>Менеджер:</b> ${managerName}</div>
          </div>

          ${specHtml}

          <div class="notes-section">
            <h3>Заметки / Особые указания:</h3>
            <div class="notes-box">${notes || 'Дополнительные указания отсутствуют.'}</div>
          </div>

          <div class="footer-signature">
            <div>
              <div class="sig-line">Подпись технолога / менеджера</div>
            </div>
            <div>
              <div class="sig-line">Подпись исполнителя (мастера)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="glass-panel" style={{ width: '300px', textAlign: 'center', padding: '24px' }}>
          Загрузка информации о сделке...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '960px', 
        maxHeight: '90vh', 
        overflowY: 'auto',
        border: '1px solid var(--border-hover)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0'
      }}>
        {/* Modal Toolbar Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Детали заказа • {dealType === '3d_printing' ? '3D Печать' : dealType === 'outdoor_ads' ? 'Наружная Реклама' : 'Общая сделка'}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit', marginTop: '2px' }}>{title || 'Сделка без названия'}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {(dealType === '3d_printing' || dealType === 'outdoor_ads') && (
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={handlePrintTechCard}
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}
              >
                <Printer size={14} />
                Техкарта
              </button>
            )}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Double Column Form Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0', flex: 1 }}>
          
          {/* Left Column: Core Deal Fields */}
          <div style={{ padding: '24px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">НАЗВАНИЕ СДЕЛКИ *</label>
              <input 
                type="text" 
                className="form-control" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">БЮДЖЕТ СДЕЛКИ (РУБ)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={cost} 
                  onChange={(e) => setCost(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">ЭТАП ВОРОНКИ</label>
                <select 
                  className="form-control" 
                  value={stage} 
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="lead">Лид / Входящий</option>
                  <option value="negotiation">Переговоры</option>
                  <option value="proposal_sent">КП отправлено</option>
                  <option value="in_production">В производстве</option>
                  <option value="installation">Монтаж / Сдача</option>
                  <option value="closed_won">Успешно завершено</option>
                  <option value="closed_lost">Проиграно / Закрыто</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">СВЯЗАННЫЙ КЛИЕНТ</label>
                <select 
                  className="form-control" 
                  value={clientId} 
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">-- Нет клиента --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ОТВЕТСТВЕННЫЙ МЕНЕДЖЕР</label>
                <select 
                  className="form-control" 
                  value={managerId} 
                  onChange={(e) => setManagerId(e.target.value)}
                >
                  <option value="">-- Не назначен --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ТИП ЗАКАЗА</label>
              <select 
                className="form-control" 
                value={dealType} 
                onChange={(e) => setDealType(e.target.value)}
              >
                <option value="general">Обычная сделка</option>
                <option value="3d_printing">3D Печать</option>
                <option value="outdoor_ads">Наружная реклама</option>
              </select>
            </div>

            {/* Payment & Debt Tracking */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                💰 Оплата и задолженность
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ВНЕСЕННАЯ ПРЕДОПЛАТА (РУБ)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={prepayment} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPrepayment(val);
                      if (val >= Number(cost) && Number(cost) > 0) {
                        setPaymentStatus('paid');
                      } else if (val > 0) {
                        setPaymentStatus('partially_paid');
                      } else {
                        setPaymentStatus('unpaid');
                      }
                    }} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">СТАТУС ОПЛАТЫ</label>
                  <select 
                    className="form-control" 
                    value={paymentStatus} 
                    onChange={(e) => {
                      const status = e.target.value;
                      setPaymentStatus(status);
                      if (status === 'paid') {
                        setPrepayment(Number(cost));
                      } else if (status === 'unpaid') {
                        setPrepayment(0);
                      }
                    }}
                  >
                    <option value="unpaid">Не оплачен</option>
                    <option value="partially_paid">Частично оплачен (предоплата)</option>
                    <option value="paid">Оплачен полностью</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                <span>Остаток к оплате (Долг):</span>
                <span style={{ fontWeight: '700', color: (Number(cost) - prepayment) > 0 ? 'var(--error)' : 'var(--success)' }}>
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Math.max(0, Number(cost) - prepayment))}
                </span>
              </div>
            </div>

            {/* Subcontracting / Outsourcing module */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="switch" style={{ width: '32px', height: '18px' }}>
                  <input 
                    type="checkbox" 
                    checked={isOutsourced} 
                    onChange={(e) => setIsOutsourced(e.target.checked)} 
                  />
                  <span className="slider" style={{ borderRadius: '18px' }}></span>
                </label>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>🤝 Перезаказ (Аутсорсинг)</span>
              </div>

              {isOutsourced && (
                <div className="form-row animate-fade-in" style={{ marginTop: '4px' }}>
                  <div className="form-group">
                    <label className="form-label">ПОДРЯДЧИК</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Имя подрядчика"
                      value={contractorName} 
                      onChange={(e) => setContractorName(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">СЕБЕСТОИМОСТЬ (РУБ)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={contractorCost} 
                      onChange={(e) => setContractorCost(Number(e.target.value))} 
                    />
                  </div>
                </div>
              )}
              
            </div>

            {/* Financial Summary & Profitability */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                📊 Финансовый итог сделки
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Бюджет сделки:</span>
                  <span style={{ fontWeight: '600' }}>
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(cost))}
                  </span>
                </div>
                {isOutsourced && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Расходы на подрядчика:</span>
                    <span style={{ fontWeight: '600', color: 'var(--error)' }}>
                      -{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(contractorCost))}
                    </span>
                  </div>
                )}
                {scrapCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Потери от брака:</span>
                    <span style={{ fontWeight: '600', color: 'var(--error)' }}>
                      -{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(scrapCost)}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid rgba(255,255,255,0.05)', 
                  paddingTop: '8px',
                  fontWeight: '700'
                }}>
                  <span>Чистая прибыль:</span>
                  <span style={{ color: 'var(--success)' }}>
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(
                      Number(cost) - (isOutsourced ? Number(contractorCost) : 0) - scrapCost
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrap & Waste Analytics section */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  ⚠️ Брак и технологические отходы
                </span>
                <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: '700' }}>
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(scrapCost)}
                </span>
              </div>

              {scrapLogs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  Брак не зарегистрирован
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '180px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 4px' }}>Материал</th>
                        <th style={{ padding: '6px 4px' }}>Кол-во</th>
                        <th style={{ padding: '6px 4px' }}>Потери</th>
                        <th style={{ padding: '6px 4px' }}>Причина</th>
                        <th style={{ padding: '6px 4px', width: '24px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {scrapLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '6px 4px' }}>{log.material_name}</td>
                          <td style={{ padding: '6px 4px' }}>{log.quantity} {log.unit}</td>
                          <td style={{ padding: '6px 4px', color: 'var(--error)' }}>
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(log.cost)}
                          </td>
                          <td style={{ padding: '6px 4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.reason}>
                            {log.reason}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteScrap(log.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0' }}
                              className="hover-danger"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add manual scrap trigger */}
              {!showAddScrap ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '6px 0', fontSize: '12px' }}
                  onClick={() => setShowAddScrap(true)}
                >
                  + Зарегистрировать брак вручную
                </button>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Новая запись о браке:</div>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>МАТЕРИАЛ ИЗ СКЛАДА</label>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                      value={manualScrap.materialId}
                      onChange={(e) => {
                        const sel = inventory.find(i => i.id === e.target.value);
                        setManualScrap(prev => ({
                          ...prev,
                          materialId: e.target.value,
                          unit: sel ? sel.unit : 'pcs'
                        }));
                      }}
                    >
                      <option value="">-- Выберите материал --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.stock_quantity} {item.unit} в наличии - {item.price_per_unit} руб/{item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row" style={{ gap: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '0', flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>КОЛ-ВО ({manualScrap.unit})</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                        value={manualScrap.quantity}
                        onChange={(e) => setManualScrap(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="0.0"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0', flex: 2 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>ПРИЧИНА</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                        value={manualScrap.reason}
                        onChange={(e) => setManualScrap(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Например, сбой станка"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '4px 0', fontSize: '11px' }}
                      onClick={() => {
                        setShowAddScrap(false);
                        setManualScrap({ materialId: '', quantity: '', reason: '', unit: 'pcs' });
                      }}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '4px 0', fontSize: '11px', background: 'var(--error)' }}
                      onClick={handleSaveManualScrap}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ minHeight: '100px' }}>
              <label className="form-label">ЗАМЕТКИ И ОПИСАНИЕ</label>
              <textarea 
                className="form-control" 
                rows="4" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                style={{ resize: 'none', height: '80px' }}
                placeholder="Дополнительные комментарии к сделке..."
              />
            </div>
          </div>

          {/* Right Column: Customized Workflow & Calculators */}
          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* General Type details */}
            {dealType === 'general' && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-dark)' }}>
                <Compass size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <h4>Стандартный тип сделки</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Смените тип сделки на 3D Печать или Наружная Реклама, чтобы открыть доступ к автоматическим калькуляторам и интеграции с производством.
                </p>
              </div>
            )}

            {/* 3D Printing Module */}
            {dealType === '3d_printing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Printer size={18} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontWeight: '700', fontFamily: 'Outfit' }}>Параметры 3D-печати</h4>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ПЛАСТИК</label>
                    {inventory.filter(i => i.category === '3d_print' && i.item_type === 'filament').length > 0 ? (
                      <select 
                        className="form-control" 
                        value={inventory.find(i => i.name === materialType)?.id || ''} 
                        onChange={(e) => {
                          const selected = inventory.find(i => i.id === e.target.value);
                          if (selected) {
                            setMaterialType(selected.name);
                            setCalcMatRate(selected.price_per_unit);
                          }
                        }}
                      >
                        <option value="" disabled>-- Выберите пластик --</option>
                        {inventory.filter(i => i.category === '3d_print' && i.item_type === 'filament').map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.price_per_unit} руб/кг)</option>
                        ))}
                      </select>
                    ) : (
                      <select className="form-control" value={materialType} onChange={(e) => handleMaterialChange(e.target.value)}>
                        <option value="PLA">PLA (стандарт)</option>
                        <option value="PETG">PETG (прочный)</option>
                        <option value="ABS">ABS (термостойкий)</option>
                        <option value="TPU">TPU (флекс/резина)</option>
                        <option value="Nylon">Nylon (инженерный)</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">ЦВЕТ</label>
                    <input type="text" className="form-control" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Черный" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ВЕС ДЕТАЛИ (Г)</label>
                    <input type="number" className="form-control" value={weightGrams} onChange={(e) => setWeightGrams(Number(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ВРЕМЯ ПЕЧАТИ (Ч)</label>
                    <input type="number" className="form-control" value={printTimeHours} onChange={(e) => setPrintTimeHours(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">МОДЕЛЬ ПРИНТЕРА</label>
                    <input type="text" className="form-control" value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">СТАТУС ПЕЧАТИ</label>
                    <select className="form-control" value={printStatus} onChange={(e) => setPrintStatus(e.target.value)}>
                      <option value="queued">В очереди</option>
                      <option value="printing">Печатается</option>
                      <option value="finished">Завершено успешно</option>
                      <option value="failed">Брак / Сбой</option>
                      <option value="post_processing">Постобработка</option>
                    </select>
                  </div>
                </div>

                {/* 3D Pricing Calculator Section */}
                <div style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>
                    <Calculator size={14} />
                    <span>Калькулятор себестоимости печати</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '10px 12px', fontSize: '12px', alignItems: 'center' }}>
                    <div>Пластик (руб/кг):</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {inventory.filter(i => i.category === '3d_print' && i.item_type === 'filament').length > 0 ? (
                        <select 
                          className="form-control" 
                          style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                          value={inventory.find(i => i.price_per_unit === calcMatRate)?.id || ''}
                          onChange={(e) => {
                            const selected = inventory.find(i => i.id === e.target.value);
                            if (selected) {
                              setCalcMatRate(selected.price_per_unit);
                              setMaterialType(selected.name);
                            }
                          }}
                        >
                          <option value="">-- Выбрать --</option>
                          {inventory.filter(i => i.category === '3d_print' && i.item_type === 'filament').map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      ) : null}
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} 
                        value={calcMatRate} 
                        onChange={(e) => setCalcMatRate(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div>Цена принтера (руб):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPrinterPrice} onChange={(e) => setCalcPrinterPrice(Number(e.target.value))} />
                    
                    <div>Срок службы принтера (ч):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPrinterLifespan} onChange={(e) => setCalcPrinterLifespan(Number(e.target.value))} />
                    
                    <div>Мощность принтера (Вт):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPrinterPower} onChange={(e) => setCalcPrinterPower(Number(e.target.value))} />
                    
                    <div>Электричество (руб/кВт·ч):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcElectricityRate} onChange={(e) => setCalcElectricityRate(Number(e.target.value))} />
                    
                    <div>Постобработка (ч):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPostHours} onChange={(e) => setCalcPostHours(Number(e.target.value))} />
                    
                    <div>Ставка постобработки (руб/ч):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPostRate} onChange={(e) => setCalcPostRate(Number(e.target.value))} />

                    <div style={{ gridColumn: 'span 2', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Наценка менеджера:</span>
                        <span>{calcMarkup}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {[25, 50, 75].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setCalcMarkup(pct)}
                            className="btn"
                            style={{ 
                              padding: '4px 0', 
                              fontSize: '11px', 
                              flex: 1, 
                              background: calcMarkup === pct ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                              color: calcMarkup === pct ? '#fff' : 'var(--text-primary)',
                              border: calcMarkup === pct ? 'none' : '1px solid var(--border-color)'
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ padding: '3px 6px', fontSize: '12px', width: '60px', textAlign: 'center' }} 
                          value={calcMarkup} 
                          onChange={(e) => setCalcMarkup(Number(e.target.value))} 
                          placeholder="Своя"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations breakdown for transparency */}
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 10px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Материал:</span>
                      <span>{Math.round((weightGrams / 1000) * calcMatRate)} руб</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Амортизация ({calcPrinterLifespan > 0 ? Math.round(calcPrinterPrice / calcPrinterLifespan) : 0} руб/ч):</span>
                      <span>{Math.round(printTimeHours * (calcPrinterLifespan > 0 ? (calcPrinterPrice / calcPrinterLifespan) : 0))} руб</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Электроэнергия ({((calcPrinterPower / 1000) * calcElectricityRate).toFixed(2)} руб/ч):</span>
                      <span>{Math.round(printTimeHours * (calcPrinterPower / 1000) * calcElectricityRate)} руб</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Работа (постобработка):</span>
                      <span>{calcPostHours * calcPostRate} руб</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '16px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(255,255,255,0.06)' 
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Рекомендуемая цена:</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{printCalcResult} руб.</div>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleApplyPrintPrice}>
                      Применить в бюджет
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Outdoor Advertising Module */}
            {dealType === 'outdoor_ads' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Compass size={18} style={{ color: 'var(--secondary)' }} />
                  <h4 style={{ fontWeight: '700', fontFamily: 'Outfit' }}>Производство рекламы</h4>
                </div>

                <div className="form-group">
                  <label className="form-label">ТИП КОНСТРУКЦИИ</label>
                  <select className="form-control" value={adType} onChange={(e) => setAdType(e.target.value)}>
                    <option value="Banner">Баннер растяжка</option>
                    <option value="Lightbox">Световой короб (Лайтбокс)</option>
                    <option value="3D Letters">Объемные световые буквы</option>
                    <option value="Pylon">Пилон / Стела</option>
                    <option value="Signboard">Информационный щит / Табличка</option>
                    <option value="Vehicle Wrap">Оклейка авто пленкой</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ШИРИНА (М)</label>
                    <input type="number" step="0.01" className="form-control" value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ВЫСОТА (М)</label>
                    <input type="number" step="0.01" className="form-control" value={heightM} onChange={(e) => setHeightM(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ИСПОЛЬЗУЕМЫЕ МАТЕРИАЛЫ</label>
                  <input type="text" className="form-control" placeholder="Пластик ПВХ, акрил, светодиодные кластеры..." value={materialsUsed} onChange={(e) => setMaterialsUsed(e.target.value)} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="switch">
                    <input type="checkbox" checked={mountingRequired} onChange={(e) => setMountingRequired(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Требуется монтаж на объекте</span>
                </div>

                {mountingRequired && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">АДРЕС МОНТАЖА</label>
                    <input type="text" className="form-control" placeholder="ул. Ленина, д. 15, кв. 3" value={installationAddress} onChange={(e) => setInstallationAddress(e.target.value)} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">ЭТАП ПРОИЗВОДСТВА</label>
                  <select className="form-control" value={outdoorStatus} onChange={(e) => setOutdoorStatus(e.target.value)}>
                    <option value="design">Дизайн / Согласование макета</option>
                    <option value="printing">Широкоформатная печать</option>
                    <option value="assembly">Сборка каркаса/монтаж электрики</option>
                    <option value="installation">Доставка и Монтаж</option>
                    <option value="completed">Конструкция сдана</option>
                  </select>
                </div>

                {/* Outdoor pricing calculator */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '12px' }}>
                    <Calculator size={14} />
                    <span>Калькулятор рекламных конструкций</span>
                  </div>

                  {/* Calculator Type Selection */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setOutdoorCalcType('banner')}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        fontSize: '11px',
                        background: outdoorCalcType === 'banner' ? 'var(--secondary)' : 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        border: outdoorCalcType === 'banner' ? 'none' : '1px solid var(--border-color)'
                      }}
                    >
                      Баннер растяжка
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutdoorCalcType('lightbox')}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        fontSize: '11px',
                        background: outdoorCalcType === 'lightbox' ? 'var(--secondary)' : 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        border: outdoorCalcType === 'lightbox' ? 'none' : '1px solid var(--border-color)'
                      }}
                    >
                      Световой короб / Буквы
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '10px 12px', fontSize: '12px', alignItems: 'center' }}>
                    <div>Площадь (м²):</div>
                    <div style={{ fontWeight: '700', fontSize: '12px' }}>{Number(widthM * heightM).toFixed(2)} м² (Пер.: {Number(2 * (widthM + heightM)).toFixed(2)} м)</div>

                    {outdoorCalcType === 'banner' ? (
                      <>
                        <div>Баннерное полотно (руб/м²):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'banner_mat').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcMatSqmRate && i.item_type === 'banner_mat')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcMatSqmRate(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'banner_mat').map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcMatSqmRate} onChange={(e) => setCalcMatSqmRate(Number(e.target.value))} />
                        </div>
                        
                        <div>Проварка краев (руб/пог.м):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'edge_tape').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcWeldRate && i.item_type === 'edge_tape')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcWeldRate(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'edge_tape').map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcWeldRate} onChange={(e) => setCalcWeldRate(Number(e.target.value))} />
                        </div>

                        <div>Количество люверсов (шт):</div>
                        <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcEyeletsCount} onChange={(e) => setCalcEyeletsCount(Number(e.target.value))} />

                        <div>Установка люверса (руб/шт):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'eyelet').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcEyeletPrice && i.item_type === 'eyelet')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcEyeletPrice(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'eyelet').map(ey => (
                                <option key={ey.id} value={ey.id}>{ey.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcEyeletPrice} onChange={(e) => setCalcEyeletPrice(Number(e.target.value))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>Лицевой материал (руб/м²):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'face_mat').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcMatSqmRate && i.item_type === 'face_mat')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcMatSqmRate(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'face_mat').map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcMatSqmRate} onChange={(e) => setCalcMatSqmRate(Number(e.target.value))} />
                        </div>
                        
                        <div>Бортовой профиль (руб/пог.м):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'side_profile').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcProfileRate && i.item_type === 'side_profile')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcProfileRate(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'side_profile').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcProfileRate} onChange={(e) => setCalcProfileRate(Number(e.target.value))} />
                        </div>

                        <div>Светодиодные модули (шт):</div>
                        <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcLedCount} onChange={(e) => setCalcLedCount(Number(e.target.value))} />

                        <div>Цена светодиода (руб/шт):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'led_module').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcLedPrice && i.item_type === 'led_module')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcLedPrice(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'led_module').map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcLedPrice} onChange={(e) => setCalcLedPrice(Number(e.target.value))} />
                        </div>

                        <div>Блоки питания (шт):</div>
                        <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcPowerSupplyCount} onChange={(e) => setCalcPowerSupplyCount(Number(e.target.value))} />

                        <div>Цена блока питания (руб/шт):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'power_supply').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcPowerSupplyPrice && i.item_type === 'power_supply')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcPowerSupplyPrice(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'power_supply').map(ps => (
                                <option key={ps.id} value={ps.id}>{ps.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcPowerSupplyPrice} onChange={(e) => setCalcPowerSupplyPrice(Number(e.target.value))} />
                        </div>
                      </>
                    )}

                    {/* Frame section */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                      <label className="switch" style={{ width: '32px', height: '18px' }}>
                        <input type="checkbox" checked={calcFrameRequired} onChange={(e) => setCalcFrameRequired(e.target.checked)} />
                        <span className="slider" style={{ borderRadius: '18px' }}></span>
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-primary)' }}>Металлический подрамник из профильной трубы</span>
                    </div>

                    {calcFrameRequired && (
                      <>
                        <div>Проф. труба с работой (руб/м):</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'frame_pipe').length > 0 ? (
                            <select 
                              className="form-control" 
                              style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }}
                              value={inventory.find(i => i.price_per_unit === calcFrameRate && i.item_type === 'frame_pipe')?.id || ''}
                              onChange={(e) => {
                                const selected = inventory.find(i => i.id === e.target.value);
                                if (selected) setCalcFrameRate(selected.price_per_unit);
                              }}
                            >
                              <option value="">-- Выбрать --</option>
                              {inventory.filter(i => i.category === 'outdoor_ads' && i.item_type === 'frame_pipe').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          ) : null}
                          <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px', width: '70px' }} value={calcFrameRate} onChange={(e) => setCalcFrameRate(Number(e.target.value))} />
                        </div>
                      </>
                    )}

                    <div>Фикс. плата (дизайн/монтаж):</div>
                    <input type="number" className="form-control" style={{ padding: '3px 6px', fontSize: '12px' }} value={calcDesignFee} onChange={(e) => setCalcDesignFee(Number(e.target.value))} />

                    {/* Markup Preset Buttons for Outdoor Ads */}
                    <div style={{ gridColumn: 'span 2', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Наценка:</span>
                        <span>{calcOutdoorMarkup}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {[25, 50, 75].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setCalcOutdoorMarkup(pct)}
                            className="btn"
                            style={{ 
                              padding: '4px 0', 
                              fontSize: '11px', 
                              flex: 1, 
                              background: calcOutdoorMarkup === pct ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              border: calcOutdoorMarkup === pct ? 'none' : '1px solid var(--border-color)'
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ padding: '3px 6px', fontSize: '12px', width: '60px', textAlign: 'center' }} 
                          value={calcOutdoorMarkup} 
                          onChange={(e) => setCalcOutdoorMarkup(Number(e.target.value))} 
                          placeholder="Своя"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown for Outdoor */}
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 10px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {outdoorCalcType === 'banner' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Полотно ({calcMatSqmRate} руб/м²):</span>
                          <span>{Math.round(widthM * heightM * calcMatSqmRate)} руб</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Усиление краев ({calcWeldRate} руб/м):</span>
                          <span>{Math.round(2 * (widthM + heightM) * calcWeldRate)} руб</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Люверсы ({calcEyeletsCount} шт * {calcEyeletPrice} руб):</span>
                          <span>{calcEyeletsCount * calcEyeletPrice} руб</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Лицевая сторона ({calcMatSqmRate} руб/м²):</span>
                          <span>{Math.round(widthM * heightM * calcMatSqmRate)} руб</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Профиль бортовой ({calcProfileRate} руб/м):</span>
                          <span>{Math.round(2 * (widthM + heightM) * calcProfileRate)} руб</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Светодиоды ({calcLedCount} шт * {calcLedPrice} руб):</span>
                          <span>{calcLedCount * calcLedPrice} руб</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Блоки питания ({calcPowerSupplyCount} шт * {calcPowerSupplyPrice} руб):</span>
                          <span>{calcPowerSupplyCount * calcPowerSupplyPrice} руб</span>
                        </div>
                      </>
                    )}
                    {calcFrameRequired && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Металлокаркас ({calcFrameRate} руб/м):</span>
                        <span>{Math.round(2 * (widthM + heightM) * calcFrameRate)} руб</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Фикс. сборка/дизайн/монтаж:</span>
                      <span>{calcDesignFee} руб</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '16px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(255,255,255,0.06)' 
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Расчет стоимости:</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{outdoorCalcResult} руб.</div>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--secondary)' }} onClick={handleApplyOutdoorPrice}>
                      Применить в бюджет
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            <Trash2 size={16} />
            Удалить сделку
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Отмена</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
