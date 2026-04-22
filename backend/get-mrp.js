const pool = require('./db.js');

async function getTotalMRP() {
  try {
    const [products] = await pool.query(
      'SELECT id, name, price, COALESCE(discount, 0) as discount FROM products'
    );
    
    let totalMRP = 0;
    let totalDiscountedPrice = 0;
    
    console.log('\n📦 PRODUCT MRP BREAKDOWN:\n');
    console.log('Sr. | Product Name      | Price (₹) | Discount | MRP (₹)');
    console.log('----|--------------------|-----------|----------|----------');
    
    products.forEach((product, index) => {
      const price = parseFloat(product.price) || 0;
      const discount = parseFloat(product.discount) || 0;
      const mrp = discount > 0 ? price / (1 - discount / 100) : price;
      totalMRP += mrp;
      totalDiscountedPrice += price;
      
      const name = product.name.substring(0, 18).padEnd(18);
      console.log(`${String(index + 1).padEnd(3)} | ${name} | ${String(price.toFixed(2)).padEnd(9)} | ${String(discount).padEnd(8)}% | ₹${mrp.toFixed(2)}`);
    });
    
    console.log('----|--------------------|-----------|----------|----------');
    console.log(`\n✅ TOTAL SUMMARY:\n`);
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Total MRP: ₹${totalMRP.toFixed(2)}`);
    console.log(`   Total Selling Price: ₹${totalDiscountedPrice.toFixed(2)}`);
    console.log(`   Total Discount: ₹${(totalMRP - totalDiscountedPrice).toFixed(2)}`);
    console.log(`   Overall Discount %: ${((totalMRP - totalDiscountedPrice) / totalMRP * 100).toFixed(2)}%\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getTotalMRP();
