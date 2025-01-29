// utils/batchRequests.js

/**
 * Processes an array of items in batches with a specified concurrency limit.
 * @param {Array} items - The array of items to process.
 * @param {Function} processFn - The function to process each item.
 * @param {number} batchSize - The number of concurrent requests.
 * @returns {Promise<Array>} - Resolves with an array of results.
 */
export const batchProcess = async (items, processFn, batchSize = 5) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processFn(item).catch(err => ({ error: err, item })))
        );
        results.push(...batchResults);
        // Optional: Add a delay between batches to be extra cautious
        await new Promise(res => setTimeout(res, 1000)); // 1 second delay
    }
    return results;
};
