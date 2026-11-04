"""Integration checks for QASM upload using an isolated in-memory database."""

import io
import os
import unittest

os.environ['QUBRIDGE_DATABASE_URI'] = 'sqlite:///:memory:'

from app import app  # noqa: E402


class RoutingFlowTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def login(self):
        response = self.client.post('/login', data={
            'username': 'admin', 'password': 'admin123'
        })
        self.assertEqual(response.status_code, 302)

    def test_pages_and_real_qasm_parse(self):
        self.login()
        for path in ('/qubit-routing', '/results', '/demos', '/simulator'):
            self.assertEqual(self.client.get(path).status_code, 200)
        page = self.client.get('/qubit-routing').get_data(as_text=True)
        self.assertIn('href="/"', page)
        self.assertIn('href="/logout"', page)
        qasm = b'OPENQASM 2.0; include "qelib1.inc"; qreg q[2]; h q[0]; cx q[0],q[1];'
        response = self.client.post('/qubit-routing/parse', data={
            'qasm_file': (io.BytesIO(qasm), 'sample.qasm')
        })
        self.assertEqual(response.status_code, 200)
        circuit = response.json['circuit']
        self.assertEqual(circuit['logicalQubits'], 2)
        self.assertEqual(circuit['gates'], [
            {'type': 'H', 'qubits': [0]},
            {'type': 'CX', 'qubits': [0, 1]},
        ])

    def test_rejects_invalid_file_without_making_a_task(self):
        self.login()
        response = self.client.post('/qubit-routing/parse', data={
            'qasm_file': (io.BytesIO(b'not QASM'), 'broken.qasm')
        })
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json['success'])
        response = self.client.post('/qubit-routing/parse', data={
            'qasm_file': (io.BytesIO(b'OPENQASM 2.0;'), 'bad.json')
        })
        self.assertEqual(response.status_code, 400)

    def test_upload_requires_login(self):
        response = self.client.post('/qubit-routing/parse', data={
            'qasm_file': (io.BytesIO(b''), 'sample.qasm')
        })
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login', response.location)


if __name__ == '__main__':
    unittest.main()
