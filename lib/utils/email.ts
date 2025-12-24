/**
 * Email utility for sending order confirmation and shipping notifications
 * Uses Resend API (recommended) or can be configured for other email services
 */

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    size?: string
    color?: string
    price: number
  }>
  totalAmount: number
  shippingAddress?: any
  trackingNumber?: string
  orderStatus?: string
  paymentMethod?: string
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll use a simple approach - log the email (you can integrate Resend, SendGrid, etc.)
    // In production, integrate with Resend API or your email service
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${data.orderNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-transform: uppercase;">URBNR</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border: 2px solid #000;">
    <h2 style="color: #000; margin-top: 0; font-size: 24px; text-transform: uppercase;">Order Confirmed!</h2>
    
    <p>Dear ${data.customerName},</p>
    
    <p>Thank you for your purchase! We're excited to let you know that we've received your order and payment has been confirmed.</p>
    
    <div style="background-color: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase;">Order Details</h3>
      <p><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p><strong>Order Date:</strong> ${data.orderDate}</p>
      <p><strong>Payment Method:</strong> ${data.paymentMethod || 'Card'}</p>
      <p><strong>Total Amount:</strong> ₹${data.totalAmount.toFixed(2)}</p>
    </div>
    
    <div style="background-color: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase;">Order Items</h3>
      ${data.items.map(item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <p style="margin: 5px 0;"><strong>${item.name}</strong></p>
          <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity}${item.size ? ` | Size: ${item.size}` : ''}${item.color ? ` | Color: ${item.color}` : ''}</p>
          <p style="margin: 5px 0;"><strong>₹${item.price.toFixed(2)}</strong></p>
        </div>
      `).join('')}
    </div>
    
    ${data.shippingAddress ? `
    <div style="background-color: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase;">Shipping Address</h3>
      <p>${data.shippingAddress.fullName || data.shippingAddress.full_name || ''}</p>
      <p>${data.shippingAddress.address_line1 || data.shippingAddress.address || ''}</p>
      ${data.shippingAddress.address_line2 ? `<p>${data.shippingAddress.address_line2}</p>` : ''}
      <p>${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.zip_code || data.shippingAddress.zipCode || ''}</p>
      <p>${data.shippingAddress.country || 'India'}</p>
      ${data.shippingAddress.phone ? `<p>Phone: ${data.shippingAddress.phone}</p>` : ''}
    </div>
    ` : ''}
    
    <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-left: 4px solid #000;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase;">What's Next?</h3>
      <ul style="padding-left: 20px;">
        <li>We'll notify you when your order ships</li>
        <li>You'll receive tracking information via email</li>
        <li>Track your order status in your account</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/orders" 
         style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; font-weight: bold; text-transform: uppercase;">
        View My Orders
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      If you have any questions, please contact our support team.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Thank you for shopping with URBNR!
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} URBNR. All rights reserved.</p>
  </div>
</body>
</html>
    `

    // TODO: Integrate with Resend API or your email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'URBNR <orders@yourdomain.com>',
    //   to: data.customerEmail,
    //   subject: `Order Confirmation - ${data.orderNumber}`,
    //   html: emailHtml,
    // })

    // For now, log the email (you should integrate with an actual email service)
    console.log('[Email] Order Confirmation Email:', {
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      orderNumber: data.orderNumber,
    })

    // In production, replace the above with actual email sending
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Failed to send order confirmation:', error)
    return { success: false, error: error.message }
  }
}

export async function sendShippingNotificationEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped - ${orderNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-transform: uppercase;">URBNR</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border: 2px solid #000;">
    <h2 style="color: #000; margin-top: 0; font-size: 24px; text-transform: uppercase;">Your Order Has Shipped! 🚚</h2>
    
    <p>Dear ${customerName},</p>
    
    <p>Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
    
    <div style="background-color: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase;">Tracking Information</h3>
      <p><strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 18px; color: #000;">${trackingNumber}</span></p>
      <p>You can track your shipment using the tracking number above.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/orders" 
         style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; font-weight: bold; text-transform: uppercase;">
        Track Your Order
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Thank you for shopping with URBNR!
    </p>
  </div>
</body>
</html>
    `

    console.log('[Email] Shipping Notification Email:', {
      to: customerEmail,
      subject: `Your Order Has Shipped - ${orderNumber}`,
      orderNumber,
      trackingNumber,
    })

    return { success: true }
  } catch (error: any) {
    console.error('[Email] Failed to send shipping notification:', error)
    return { success: false, error: error.message }
  }
}





