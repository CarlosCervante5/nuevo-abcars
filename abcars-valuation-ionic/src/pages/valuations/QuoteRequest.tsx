import React, { useEffect, useMemo, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { Valuation } from '../../models';
import './QuoteRequest.css';

type Seller = {
  uuid: string;
  user_profile: {
    name: string;
    last_name: string;
  };
};

const QuoteRequest: React.FC = () => {
  const { valuationUuid } = useParams<{ valuationUuid: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [form, setForm] = useState({
    take: '',
    sale: '',
    take_intelimotors: '',
    sale_intelimotors: '',
    workforce: '',
    spare_parts: '',
    hyp: '',
    total: '',
    take_value: '',
    final_offer: '',
    seller: '',
    comments: '',
    direct_purchase: false,
    take_into_account: false,
    direct_purchase_take_account: false,
  });

  const totalReconditioning = useMemo(() => {
    const workforce = parseFloat(form.workforce) || 0;
    const spareParts = parseFloat(form.spare_parts) || 0;
    const hyp = parseFloat(form.hyp) || 0;
    return (workforce + spareParts + hyp).toFixed(2);
  }, [form.workforce, form.spare_parts, form.hyp]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, total: totalReconditioning }));
  }, [totalReconditioning]);

  useEffect(() => {
    if (!valuationUuid) return;
    loadQuoteData();
    loadSellers();
  }, [valuationUuid]);

  const loadSellers = async () => {
    try {
      const response = await valuationService.getSellers();
      setSellers(response.data?.users ?? []);
    } catch {
      setSellers([]);
    }
  };

  const loadQuoteData = async () => {
    if (!valuationUuid) return;
    try {
      setLoading(true);
      const response = await valuationService.getValuationDetail(valuationUuid);
      if (response.status !== 200 || !response.data) return;

      const valuation: Valuation = response.data;
      const spareParts = valuation.spareParts ?? valuation.spare_parts ?? [];
      const repairs = valuation.repairs ?? [];

      let sumLabor = 0;
      let sumCost = 0;
      let sumRepairs = 0;

      spareParts.forEach((part) => {
        sumLabor += part.labor_time || 0;
        sumCost += (part.part_supplier_original?.cost || 0) * (part.quantity || 0);
      });
      repairs.forEach((repair) => {
        sumRepairs += repair.cost || 0;
      });

      const workforce = (sumLabor * 45).toFixed(2);
      const sparePartsCost = sumCost.toFixed(2);
      const hyp = sumRepairs.toFixed(2);

      setForm((prev) => ({
        ...prev,
        workforce,
        spare_parts: sparePartsCost,
        hyp,
      }));

      if (valuation.status === 'valuated') {
        setForm((prev) => ({
          ...prev,
          take: String(valuation.book_trade_in_offer ?? ''),
          sale: String(valuation.book_sale_price ?? ''),
          take_intelimotors: String(valuation.intellimotors_trade_in_offer ?? ''),
          sale_intelimotors: String(valuation.intellimotors_sale_price ?? ''),
          take_value: String(valuation.trade_in_final ?? ''),
          final_offer: String(valuation.final_offer ?? ''),
          seller: valuation.seller?.[0]?.uuid ?? '',
          comments: valuation.comments ?? '',
          direct_purchase: valuation.take_type === 'Compra directa',
          take_into_account: valuation.take_type === 'Toma a cuenta',
          direct_purchase_take_account: valuation.take_type === 'Compra directa/Toma a cuenta',
        }));
      }
    } catch {
      setToastMessage('Error al cargar la cotización.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.take || !form.sale || !form.take_intelimotors || !form.sale_intelimotors) {
      return 'Completa los valores de cotización.';
    }
    if (!form.workforce || !form.spare_parts || !form.hyp) {
      return 'Completa los costos de reacondicionamiento.';
    }
    if (!form.take_value || !form.final_offer) {
      return 'Completa el valor toma y la oferta final.';
    }
    if (!form.seller) {
      return 'Selecciona un vendedor.';
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!valuationUuid) return;
    const error = validateForm();
    if (error) {
      setToastMessage(error);
      setShowToast(true);
      return;
    }

    const takeType = form.direct_purchase
      ? 'Compra directa'
      : form.take_into_account
      ? 'Toma a cuenta'
      : form.direct_purchase_take_account
      ? 'Compra directa/Toma a cuenta'
      : 'No hay tipo de toma';

    try {
      setSaving(true);
      const res = await valuationService.updateValuation({
        valuation_uuid: valuationUuid,
        seller_uuid: form.seller,
        book_trade_in_offer: Number(form.take),
        book_sale_price: Number(form.sale),
        intellimotors_trade_in_offer: Number(form.take_intelimotors),
        intellimotors_sale_price: Number(form.sale_intelimotors),
        labor_cost: Number(form.workforce),
        spare_parts_cost: Number(form.spare_parts),
        body_work_painting_cost: Number(form.hyp),
        estimated_total: Number(form.total),
        trade_in_final: Number(form.take_value),
        final_offer: Number(form.final_offer),
        status: 'valuated',
        comments: form.comments,
        take_type: takeType,
      });
      setToastMessage((res as any)?.message || 'Alta de registro exitoso.');
      setShowToast(true);
      setTimeout(() => {
        history.push('/valuations', { refresh: true });
      }, 1200);
    } catch {
      setToastMessage('Error al guardar la cotización.');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/valuations/${valuationUuid}`} />
          </IonButtons>
          <IonTitle>Valuar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message="Cargando cotización..." />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Cotización</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Toma (Libro Guía) MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.take}
                      onIonInput={(e) =>
                        setForm({ ...form, take: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Venta (Libro Guía) MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.sale}
                      onIonInput={(e) =>
                        setForm({ ...form, sale: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Toma (Intelimotors) MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.take_intelimotors}
                      onIonInput={(e) =>
                        setForm({ ...form, take_intelimotors: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Venta (Intelimotors) MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.sale_intelimotors}
                      onIonInput={(e) =>
                        setForm({ ...form, sale_intelimotors: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Mano de obra MXN</IonLabel>
                    <IonInput type="number" value={form.workforce} readonly />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Partes / Refacciones MXN</IonLabel>
                    <IonInput type="number" value={form.spare_parts} readonly />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">HyP MXN</IonLabel>
                    <IonInput type="number" value={form.hyp} readonly />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Total MXN</IonLabel>
                    <IonInput type="number" value={form.total} readonly />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Valor toma MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.take_value}
                      onIonInput={(e) =>
                        setForm({ ...form, take_value: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Oferta final MXN</IonLabel>
                    <IonInput
                      type="number"
                      value={form.final_offer}
                      onIonInput={(e) =>
                        setForm({ ...form, final_offer: e.detail.value || '' })
                      }
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4">
                  <IonItem lines="none" className="quote-request-toggle">
                    <IonCheckbox
                      checked={form.direct_purchase}
                      onIonChange={(e) =>
                        setForm({ ...form, direct_purchase: e.detail.checked })
                      }
                    />
                    <IonLabel>Compra directa</IonLabel>
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="4">
                  <IonItem lines="none" className="quote-request-toggle">
                    <IonCheckbox
                      checked={form.take_into_account}
                      onIonChange={(e) =>
                        setForm({ ...form, take_into_account: e.detail.checked })
                      }
                    />
                    <IonLabel>Toma a cuenta</IonLabel>
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="4">
                  <IonItem lines="none" className="quote-request-toggle">
                    <IonCheckbox
                      checked={form.direct_purchase_take_account}
                      onIonChange={(e) =>
                        setForm({ ...form, direct_purchase_take_account: e.detail.checked })
                      }
                    />
                    <IonLabel>Compra directa / Toma a cuenta</IonLabel>
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonItem>
              <IonLabel position="stacked">Vendedor</IonLabel>
              <IonSelect
                value={form.seller}
                placeholder="Seleccione un vendedor"
                onIonChange={(e) => setForm({ ...form, seller: e.detail.value })}
              >
                {sellers.map((seller) => (
                  <IonSelectOption key={seller.uuid} value={seller.uuid}>
                    {seller.user_profile.name} {seller.user_profile.last_name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Comentarios</IonLabel>
              <IonTextarea
                rows={5}
                value={form.comments}
                onIonInput={(e) => setForm({ ...form, comments: e.detail.value || '' })}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="ion-margin-top"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Enviando...' : 'Enviar'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default QuoteRequest;
