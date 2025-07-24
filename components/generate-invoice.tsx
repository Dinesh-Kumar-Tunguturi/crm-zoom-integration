// // components/generate-invoice.tsx
// import {
//   Document, Page, Text, View, StyleSheet, Font,
// } from '@react-pdf/renderer';

// // 🧠 Watermark style
// const styles = StyleSheet.create({
//   page: {
//     padding: 30,
//     position: 'relative',
//     fontSize: 12,
//     fontFamily: 'Helvetica',
//   },
//   watermark: {
//     position: 'absolute',
//     top: '40%',
//     left: '10%',
//     transform: 'rotate(-45deg)',
//     fontSize: 50,
//     color: '#eeeeee',
//     opacity: 0.3,
//   },
//   section: { marginBottom: 10 },
//   table: { width: '100%', marginTop: 10 },
//   row: { flexDirection: 'row', borderBottom: '1px solid #eee', padding: 4 },
//   cell: { flex: 1 },
//   bold: { fontWeight: 'bold' },
//   total: { textAlign: 'right', marginTop: 20 },
// });

// export function InvoicePDF({ data }: { data: any }) {
//   const {
//     business_id,
//     client_name,
//     email,
//     phone,
//     closed_at,
//     subscription_cycle,
//     payment_mode,
//     sale_value,
//     resume_sale_value,
//     portfolio_sale_value,
//     linkedin_sale_value,
//     github_sale_value,
//     total_value,
//   } = data;

//   const rows = [
//     { name: 'Base Subscription', qty: subscription_cycle / 30, price: sale_value },
//     ...(resume_sale_value ? [{ name: 'Resume Creation', qty: 1, price: resume_sale_value }] : []),
//     ...(portfolio_sale_value ? [{ name: 'Portfolio Creation', qty: 1, price: portfolio_sale_value }] : []),
//     ...(linkedin_sale_value ? [{ name: 'LinkedIn Optimization', qty: 1, price: linkedin_sale_value }] : []),
//     ...(github_sale_value ? [{ name: 'GitHub Optimization', qty: 1, price: github_sale_value }] : []),
//   ];

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <Text style={styles.watermark}>APPLYWIZZ</Text>

//         <View style={styles.section}>
//           <Text style={styles.bold}>Invoice No:</Text>
//           <Text>AWINV-{business_id}</Text>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.bold}>Billed To:</Text>
//           <Text>{client_name}</Text>
//           <Text>{email}</Text>
//           <Text>{phone}</Text>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.bold}>Date:</Text>
//           <Text>{new Date(closed_at).toLocaleDateString('en-IN')}</Text>
//         </View>

//         <View style={styles.table}>
//           <View style={[styles.row, styles.bold]}>
//             <Text style={styles.cell}>Item</Text>
//             <Text style={styles.cell}>Qty</Text>
//             <Text style={styles.cell}>Price</Text>
//             <Text style={styles.cell}>Total</Text>
//           </View>
//           {rows.map((item, i) => (
//             <View style={styles.row} key={i}>
//               <Text style={styles.cell}>{item.name}</Text>
//               <Text style={styles.cell}>{item.qty}</Text>
//               <Text style={styles.cell}>${item.price}</Text>
//               <Text style={styles.cell}>${item.price * item.qty}</Text>
//             </View>
//           ))}
//         </View>

//         <Text style={styles.total}>Total: ${total_value}</Text>
//         <Text>Payment Mode: {payment_mode}</Text>
//       </Page>
//     </Document>
//   );
// }


// components/generate-invoice.tsx
"use client";

import { Document, Page, Text, StyleSheet, View } from "@react-pdf/renderer";

// 🔧 Basic styling
const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { marginBottom: 10 },
  heading: { fontSize: 24, marginBottom: 10 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 14, marginBottom: 6 },
});

export function InvoicePDF({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading}>APPLYWIZZ INVOICE</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Client ID:</Text>
          <Text style={styles.value}>{data.lead_id}</Text>

          <Text style={styles.label}>Client Name:</Text>
          <Text style={styles.value}>{data.lead_name}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.email}</Text>

          <Text style={styles.label}>Subscription Cycle:</Text>
          <Text style={styles.value}>{data.subscription_cycle} days</Text>

          <Text style={styles.label}>Payment Mode:</Text>
          <Text style={styles.value}>{data.payment_mode}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Breakdown:</Text>
          <Text style={styles.value}>Resume: ₹{data.resume_sale_value || 0}</Text>
          <Text style={styles.value}>Portfolio: ₹{data.portfolio_sale_value || 0}</Text>
          <Text style={styles.value}>LinkedIn: ₹{data.linkedin_sale_value || 0}</Text>
          <Text style={styles.value}>GitHub: ₹{data.github_sale_value || 0}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Sale Value:</Text>
          <Text style={styles.value}>₹{data.total_value}</Text>
        </View>
      </Page>
    </Document>
  );
}
