import getSymbolFromCurrency from "currency-symbol-map";

export function getCurrencySymbol(code : string) : string{
    const symbol = getSymbolFromCurrency(code.toUpperCase());
    return symbol || code.toUpperCase();
}

export function formatPrice(amount : number | string | any , currency="INR") : string{
    const numericAmount = typeof amount === "number" ? amount : parseFloat(amount || "0");
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericAmount.toFixed(2)}`;
}