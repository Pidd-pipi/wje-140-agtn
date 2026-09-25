export function calculateProfit(freight: number, fuelCost: number, tollCost: number, laborCost: number) {
  return freight - fuelCost - tollCost - laborCost;
}
export function calculateTotalCost(...items: number[]) {
  return items.reduce((sum, item) => sum + item, 0);
}
