const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

async function getProducts() {
  try {
    console.log('📦 Getting products...\n');

    const loginRes = await axios.post(`${BASE_URL}/api/admin/login`, {
      email: 'admin@honeybee.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.token;

    const res = await axios.get(`${BASE_URL}/api/admin/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Products found:', res.data.length);
    res.data.forEach(p => {
      console.log(`\nID: ${p.id}, Name: ${p.name}, Image: ${p.image}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

getProducts();
