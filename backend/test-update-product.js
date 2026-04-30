const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const BASE_URL = 'http://localhost:10000';

// Test updating a product with a new image
async function testUpdateProduct() {
  try {
    console.log('🔄 Testing Update Product with Image...\n');

    // Get admin token first
    console.log('1️⃣ Getting admin token...');
    const loginRes = await axios.post(`${BASE_URL}/api/admin/login`, {
      email: 'admin@honeybee.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Token obtained:', token.substring(0, 20) + '...');

    // Prepare FormData with image
    const form = new FormData();
    form.append('name', 'Test Product Updated');
    form.append('price', '999.99');
    form.append('discount', '5');
    form.append('description', 'Updated test product description');
    form.append('stock', '50');
    form.append('image', fs.createReadStream('./uploads/1775824327581-gds-photo-30kb.jpg'));

    console.log('\n2️⃣ Updating product with ID 6...');
    console.log('Form data keys:', ['name', 'price', 'discount', 'description', 'stock', 'image']);

    const updateRes = await axios.put(`${BASE_URL}/api/admin/products/6`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('\n✅ Update successful!');
    console.log('Response status:', updateRes.status);
    console.log('Product data:', JSON.stringify(updateRes.data, null, 2));

  } catch (error) {
    console.error('\n❌ Update failed!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
    console.error('Details:', error.message);
  }
}

testUpdateProduct();
