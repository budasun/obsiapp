import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Inicializamos los poderes de administrador para escribir en Firestore
admin.initializeApp();
const db = admin.firestore();

// Inicializamos Stripe (Reemplazaremos esto con tus llaves reales luego)
// Reemplaza 'sk_test_...' con tu clave secreta real de Stripe
const stripe = new Stripe('sk_test_TU_CLAVE_SECRETA_AQUI', {
    apiVersion: '2026-02-25.clover',
});

// Esta es la contraseña secreta entre Stripe y Firebase
const endpointSecret = 'whsec_TU_SECRETO_DE_WEBHOOK_AQUI';

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        // Verificamos que el mensaje realmente venga de Stripe y no sea un hacker
        event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`Error de firma de Webhook: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Si el evento es un pago completado con éxito
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // ¡Aquí recuperamos el ID de la usuaria que inyectaste en React!
        const userId = session.client_reference_id;

        if (userId) {
            // Determinamos qué compró (Libro o Membresía)
            // Primero verificamos si es un pago gratuito (cupón 100%)
            const isFree = session.amount_total === 0 || session.amount_total === null;
            
            // Buscamos el precio del producto
            const priceId = session.line_items?.data?.[0]?.price?.id;
            
            // Mapeo de price IDs a tipos de compra (ajusta estos IDs con los tuyos de Stripe)
            // Estos son ejemplos - verifica los IDs en tu dashboard de Stripe
            const bookPriceIds = ['price_xxx', 'price_libro']; // IDs de precios del libro
            const proPriceIds = ['price_xxx', 'price_pro']; // IDs de precios PRO

            let isBookPurchase = false;
            let isProPurchase = false;

            if (priceId) {
                isBookPurchase = bookPriceIds.some(id => priceId.includes(id));
                isProPurchase = proPriceIds.some(id => priceId.includes(id));
            } else if (session.metadata?.productType) {
                // También puedes pasar el tipo de producto en los metadata desde React
                isBookPurchase = session.metadata.productType === 'book';
                isProPurchase = session.metadata.productType === 'pro';
            } else if (isFree) {
                // Si es gratuito pero tuvo éxito, asumimos PRO (cupón 100%)
                isProPurchase = true;
            }

            const userRef = db.collection('users').doc(userId);

            if (isBookPurchase) {
                await userRef.update({ hasBook: true });
                console.log(`Candado del Libro abierto para el usuario: ${userId}`);
            } 
            if (isProPurchase) {
                await userRef.update({ isPremium: true });
                console.log(`Candado PRO abierto para el usuario: ${userId}`);
            }
        }
    }

    // Le respondemos a Stripe que todo salió bien
    res.status(200).send('Recibido por Obsidiana');
});