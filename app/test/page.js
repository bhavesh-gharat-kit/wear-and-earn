export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Vercel Deployment Test</h1>
      <p>✅ If you can see this page, the deployment is working!</p>
      <p>🕐 Timestamp: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h3>Navigation Tests:</h3>
        <ul>
          <li>Home Page: /</li>
          <li>Health Check API: /api/health-check</li>
          <li>Products Page: /products</li>
          <li>Login Page: /login</li>
        </ul>
      </div>
    </div>
  );
}
