// API functions for communicating with the backend
import { BASE_URL } from "./config";

export async function getCurrentMonthStats() {
  const response = await fetch(`${BASE_URL}/stats/current-month`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current month stats: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRecentExpenses() {
  const response = await fetch(`${BASE_URL}/expenses/recent`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent expenses: ${response.statusText}`);
  }
  return await response.json();
}

export async function getMonthlyStats() {
  const response = await fetch(`${BASE_URL}/stats/by-month`);
  if (!response.ok) {
    throw new Error(`Failed to fetch monthly stats: ${response.statusText}`);
  }
  return await response.json();
}

export async function createExpense(data) {
  const response = await fetch(`${BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create expense: ${response.statusText}`);
  }
  return await response.json();
}

