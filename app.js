const balance = document.getElementById('balance');
const income = document.getElementById('income');
const expense = document.getElementById('expense');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const dateInput = document.getElementById('dateInput');

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
    });
});

// Swipe to switch tabs
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    
    const distance = touchEndX - touchStartX;
    if (Math.abs(distance) < 50) return; // Ignora swipes curtos

    const isHomeActive = document.getElementById('tab-home').classList.contains('active');
    
    // Swipe left -> Vai para Tabela
    if (distance < -50 && isHomeActive) {
        document.querySelector('[data-tab="table"]').click();
    }
    // Swipe right -> Vai para Home
    else if (distance > 50 && !isHomeActive) {
        document.querySelector('[data-tab="home"]').click();
    }
}, { passive: true });

// Recuperar do localStorage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Formata para a moeda Brasileira R$
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Adiciona dom 
function addTransactionDOM(transaction) {
    const isExpense = transaction.type === 'expense';
    const sign = isExpense ? '-' : '+';
    const item = document.createElement('tr');

    item.classList.add(isExpense ? 'minus' : 'plus');
    
    const dateValue = transaction.date ? transaction.date.split('T')[0] : '';
    const dateStr = transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';
    
    item.innerHTML = `
        <td class="t-balance">${formatCurrency(transaction.currentBalance || 0)}</td>
        <td class="t-name">${transaction.text}</td>
        <td class="t-amount ${isExpense ? 'minus-text' : 'plus-text'}">
            <span>${sign} ${formatCurrency(Math.abs(transaction.amount))}</span>
        </td>
        <td class="t-date" style="position: relative;">
            <span style="font-size: 11px; color: var(--text-secondary);">${dateStr}</span>
            <input type="date" value="${dateValue}" onchange="updateTransactionDate(${transaction.id}, this.value)" style="opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer; border: none; padding: 0; margin: 0; -webkit-appearance: none; appearance: none;">
        </td>
    `;

    let pressTimer;
    const startPress = () => {
        pressTimer = setTimeout(() => openEditModal(transaction), 600);
    };
    const cancelPress = () => clearTimeout(pressTimer);

    item.addEventListener('touchstart', startPress, {passive: true});
    item.addEventListener('touchend', cancelPress);
    item.addEventListener('touchmove', cancelPress);
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);

    list.appendChild(item);
}

let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderList();
    });
});

function renderList() {
    list.innerHTML = '';
    let filteredTransactions = transactions;
    if (currentFilter !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === currentFilter);
    }
    
    let runningBalance = 0;
    const withBalance = [...filteredTransactions].reverse().map(t => {
        runningBalance += (t.type === 'income' ? t.amount : -t.amount);
        return { ...t, currentBalance: runningBalance };
    }).reverse();

    withBalance.forEach(addTransactionDOM);
    
    const total = filteredTransactions.reduce((acc, t) => {
        return acc + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    const visibleTotalEl = document.getElementById('visible-total');
    if (visibleTotalEl) {
        visibleTotalEl.innerText = formatCurrency(total);
    }
}

// Atualiza placares de valores gerais
function updateValues() {
    const amounts = transactions.map(t => t.type === 'income' ? t.amount : -Math.abs(t.amount));

    const total = amounts.reduce((acc, item) => (acc += item), 0);
    
    const incomeTotal = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expenseTotal = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    balance.innerText = formatCurrency(total);
    income.innerText = formatCurrency(incomeTotal);
    expense.innerText = formatCurrency(expenseTotal);
}

// Atualiza data por ID e regrava
window.updateTransactionDate = function(id, newDateStr) {
    const newDate = newDateStr ? new Date(newDateStr + 'T12:00:00').toISOString() : new Date().toISOString();
    transactions = transactions.map(t => {
        if (t.id === id) {
            return { ...t, date: newDate };
        }
        return t;
    });
    
    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    updateLocalStorage();
    init();
}

// Remove por ID e regrava
window.removeTransaction = function(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

// Atualiza localStorage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init App (Lê dados e re-renderiza lista)
function init() {
    renderList();
    updateValues();
}

// Lidar com o Submit do formulário imediatamente
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Por favor preencha nome e valor da transação');
        return;
    }

    const typeValue = document.querySelector('input[name="type"]:checked').value;

    const transactionDate = dateInput.value;
    const finalDate = transactionDate ? new Date(transactionDate + 'T12:00:00').toISOString() : new Date().toISOString();

    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        text: text.value,
        amount: Math.abs(+amount.value), // garante valor positivo interno, o sinal vem do type
        type: typeValue,
        date: finalDate
    };

    transactions.unshift(transaction); // insere no topo
    // Sort after adding new to ensure order
    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    renderList();
    updateValues();
    updateLocalStorage();

    text.value = '';
    amount.value = '';
    dateInput.value = '';
    
    // Rola a lista para o topo para mostrar o item novo em telas pequenas
    init(); 
});

// Modal Logic
const editModal = document.getElementById('edit-modal');
const editText = document.getElementById('edit-text');
const editAmount = document.getElementById('edit-amount');
const editDate = document.getElementById('edit-date');
const btnSaveEdit = document.getElementById('btn-save-edit');
const btnDeleteEdit = document.getElementById('btn-delete-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
let editingTransactionId = null;

function openEditModal(transaction) {
    editingTransactionId = transaction.id;
    editText.value = transaction.text;
    editAmount.value = transaction.amount;
    editDate.value = transaction.date ? transaction.date.split('T')[0] : '';
    
    document.querySelector(`input[name="edit-type"][value="${transaction.type}"]`).checked = true;
    
    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
    editingTransactionId = null;
}

btnCancelEdit.addEventListener('click', closeEditModal);

btnDeleteEdit.addEventListener('click', () => {
    if (editingTransactionId) {
        removeTransaction(editingTransactionId);
        closeEditModal();
    }
});

btnSaveEdit.addEventListener('click', () => {
    if (editingTransactionId) {
        if (editText.value.trim() === '' || editAmount.value.trim() === '') {
            alert('Por favor preencha nome e valor');
            return;
        }

        const typeValue = document.querySelector('input[name="edit-type"]:checked').value;
        const transactionDate = editDate.value;
        const finalDate = transactionDate ? new Date(transactionDate + 'T12:00:00').toISOString() : new Date().toISOString();

        transactions = transactions.map(t => {
            if (t.id === editingTransactionId) {
                return {
                    ...t,
                    text: editText.value,
                    amount: Math.abs(+editAmount.value),
                    type: typeValue,
                    date: finalDate
                };
            }
            return t;
        });

        transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        updateLocalStorage();
        init();
        closeEditModal();
    }
});

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

init();

// Registro do Service Worker (Para PWA e Funcionamento offline local)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso: ', reg.scope))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    });
}
