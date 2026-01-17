import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

async function testCRUD() {
    try {
        console.log('Testing Cattle CRUD...');
        // 1. Create Cattle
        const cattleRes = await axios.post(`${API_URL}/cattle`, {
            cattleId: `TEST-${Date.now()}`,
            name: 'Test Cow',
            category: 'cow',
            gender: 'female',
            breed: 'Jersey',
            dateOfBirth: '2020-01-01',
            dateOfAcquisition: '2022-01-01',
            acquisitionType: 'purchased',
            weight: { current: 400, history: [] },
            status: 'active'
        });
        console.log('Create Cattle: SUCCESS', cattleRes.data.data.data._id);
        const cattleId = cattleRes.data.data.data._id;

        // 2. Get Cattle
        await axios.get(`${API_URL}/cattle/${cattleId}`);
        console.log('Get Cattle: SUCCESS');

        // 3. Update Cattle
        await axios.patch(`${API_URL}/cattle/${cattleId}`, { notes: 'Updated note' });
        console.log('Update Cattle: SUCCESS');

        // 4. Delete Cattle
        await axios.delete(`${API_URL}/cattle/${cattleId}`);
        console.log('Delete Cattle: SUCCESS');

        console.log('\nTesting Milk CRUD...');
        const milkRes = await axios.post(`${API_URL}/milk`, {
            cattleId: 'some-cattle-id', // keeping it loose since we removed tight coupling
            session: 'morning',
            date: new Date(),
            quantity: 10,
            soldTo: 'dairy',
            pricePerLiter: 40,
            totalAmount: 400
        });
        console.log('Create Milk: SUCCESS');

        await axios.delete(`${API_URL}/milk/${milkRes.data.data.data._id}`);
        console.log('Delete Milk: SUCCESS');

        console.log('\nAll tests passed!');
    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testCRUD();
