const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const router = express.Router();

function parsePreco(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  return parseFloat(
    value
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  ) || 0;
}

function getPublicSiteUrl(req) {
  const configuredUrl = (process.env.PUBLIC_SITE_URL || '').trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}/front-end`;
}

function getMercadoPagoClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }

  return new MercadoPagoConfig({
    accessToken
  });
}

router.post('/checkout-pro/preference', async (req, res) => {
  const { items = [], customer = {}, shipping = 0 } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' });
  }

  const normalizedItems = items.map((item, index) => {
    const quantity = Math.max(parseInt(item.qty, 10) || 1, 1);
    const unitPrice = parsePreco(item.price);

    return {
      id: String(item.id || `item-${index + 1}`),
      title: item.name || `Produto ${index + 1}`,
      description: item.description || item.name || `Produto ${index + 1}`,
      picture_url: item.img || undefined,
      quantity,
      currency_id: 'BRL',
      unit_price: Number(unitPrice.toFixed(2))
    };
  });

  const frete = Math.max(parsePreco(shipping), 0);

  if (frete > 0) {
    normalizedItems.push({
      id: 'frete',
      title: 'Frete',
      description: 'Entrega do pedido',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: Number(frete.toFixed(2))
    });
  }

  const publicSiteUrl = getPublicSiteUrl(req);
  const externalReference = `sol-${Date.now()}`;

  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: normalizedItems,
        payer: {
          name: customer.name || undefined,
          email: customer.email || undefined
        },
        back_urls: {
          success: `${publicSiteUrl}/pagamento.html?mp_status=success`,
          failure: `${publicSiteUrl}/pagamento.html?mp_status=failure`,
          pending: `${publicSiteUrl}/pagamento.html?mp_status=pending`
        },
        auto_return: 'approved',
        external_reference: externalReference,
        statement_descriptor: 'SOL MODA PRAIA'
      }
    });

    return res.status(201).json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point || null,
      externalReference
    });
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    return res.status(500).json({
      error: 'Não foi possível iniciar o checkout do Mercado Pago.'
    });
  }
});

module.exports = router;
