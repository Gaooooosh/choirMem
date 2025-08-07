
                      updateFilters({
                        dateRange: { ...filters.dateRange, to: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default SearchFilters
