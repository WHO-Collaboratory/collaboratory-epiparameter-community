# =============================================================================
# SCRIPT: Using grEPI to Create Epidemiological Parameter Summary Tables
# =============================================================================
# 
# LEARNING OBJECTIVES:
# - Connect to WHO Collaboratory grEPI API endpoints
# - Extract and clean epidemiological parameters from API responses
# - Create publication-ready summary tables for pathogen parameters
# - Apply data wrangling techniques for epidemiological data
#
# PREREQUISITES: 
# - Basic R knowledge (data frames, pipes, functions)
# - Understanding of epidemiological concepts
#
# WHAT IS grEPI?
# grEPI (Global Repository of Epidemiological Parameters) is WHO's centralized
# database containing systematically reviewed epidemiological parameters for
# various pathogens. This script demonstrates how to programmatically access
# and summarize these parameters.
# =============================================================================

# LOAD REQUIRED LIBRARIES -----------------------------------------------------
# Note: Install packages if needed using install.packages("packagename")
library(httr)       # For HTTP requests to APIs
library(jsonlite)   # To parse JSON responses from APIs
library(tidyverse)  # For data wrangling and visualization
library(janitor)    # For cleaning column names and data inspection
library(pander)     # For nicely formatted table output

# Display loaded packages for confirmation
cat("✓ All required libraries loaded successfully\n\n")


# PART 1: EXPLORE AVAILABLE ENDPOINTS ----------------------------------------
cat("PART 1: Discovering Available Data Sources\n")
cat("==========================================\n")

##-- Step 1: Connect to WHO Collaboratory root API --##
# Why: First we need to see what datasets are available in the API
cat("→ Connecting to WHO Collaboratory API...\n")

url <- "https://xmart-api-public-uat.who.int/COLLAB" 
response <- GET(url)

# Error handling: Check if API request was successful
if(status_code(response) != 200) {
  stop("API request failed with status: ", status_code(response), 
       "\nTip: Check internet connection or try again later")
}

cat("✓ Successfully connected to API\n")

##-- Step 2: Parse the JSON content returned by the API --##
# Why: APIs return data in JSON format, which we need to convert to R data frames
json_text <- content(response, "text")
data <- fromJSON(json_text)
endpoint_df <- data$value

##-- Step 3: Inspect the list of available endpoints --##
cat("\nAvailable datasets in grEPI:\n")
pander::pander(endpoint_df)

cat("\nTIP: Look for datasets ending in '_PARAMETERS' for epidemiological data\n\n")


# PART 2: EXTRACT MPOX PARAMETERS --------------------------------------------
cat("PART 2: Extracting Mpox Epidemiological Parameters\n")
cat("==================================================\n")

##-- Step 1: Connect to WHO Collaboratory xMart Mpox Parameters API --##
# Why: Now we'll focus on mpox (monkeypox) parameters as our example
cat("→ Fetching mpox parameter data...\n")

url <- "https://xmart-api-public-uat.who.int/COLLAB/MPOX_PARAMETERS" 
response <- GET(url)

# Error handling
if(status_code(response) != 200) {
  stop("Failed to fetch mpox data. Status: ", status_code(response))
}

##-- Step 2: Parse the JSON content and extract the data --##
json_text <- content(response, "text")
json_data <- fromJSON(json_text)
mpox_parameters_table <- json_data$value

# Initial data cleaning
mpox_raw <- mpox_parameters_table %>%
  janitor::clean_names() %>% # Convert to lowercase, snake_case
  select(-starts_with("sys_"), -record_id) # Remove system/technical fields

cat("✓ Raw data extracted:", nrow(mpox_raw), "records\n")

##-- Step 3: Identify and extract relevant fields --##
# Why: Understanding the data structure helps us select the right variables
cat("\nData structure overview:\n")
glimpse(mpox_raw)

# Focus on parameter-related columns
mpox_df <- mpox_raw %>% 
  select(
    starts_with("param_"),      # Parameter values and metadata
    distribution_type_fk,       # Statistical distribution info
    starts_with("pop_"),        # Population characteristics
    starts_with("article_")     # Source publication info
  ) 

cat("\n✓ Focused dataset created with", ncol(mpox_df), "relevant columns\n")


# PART 3: FOCUS ON INCUBATION PERIOD PARAMETERS ------------------------------
cat("\nPART 3: Filtering for Incubation Period Data\n")
cat("=============================================\n")

##-- Step 4: Explore available parameter types --##
# Why: Understanding what parameters are available helps us make informed choices
cat("→ Available parameter subtypes:\n")
param_summary <- janitor::tabyl(mpox_df$param_subtype_fk)
print(param_summary)

# Filter for incubation period parameters
# Why: Incubation period is a key epidemiological parameter for outbreak modeling
mpox_ip <- mpox_df %>% 
  filter(
    param_type_fk == "Human delay",  # Focus on human transmission delays
    param_subtype_fk %in% c("incubation period", "incubation period (infection to onset)"),
    param_unit_fk == "Days"  # Ensure consistent time units
  ) 

cat("✓ Filtered to", nrow(mpox_ip), "incubation period records\n")

# Data quality check
if(nrow(mpox_ip) == 0) {
  warning("No incubation period data found. Check filter criteria.")
}


# PART 4: DATA CLEANING AND TRANSFORMATION -----------------------------------
cat("\nPART 4: Cleaning and Standardizing the Data\n")
cat("============================================\n")

##-- Step 5: Comprehensive data cleaning --##
# Why: Clean, standardized data is essential for accurate analysis and presentation
cat("→ Applying data transformations...\n")

mpox_clean <- mpox_ip %>%
  mutate(
    # Convert data types for proper calculations
    across(matches("^param_uncert_.*_val$"), as.numeric),
    across(matches("^pop_age_"), as.integer),
    
    # Standardize numeric precision
    across(where(is.numeric), ~ round(.x, 1)), 
    
    # Improve readability of categorical variables
    param_value_type_fk = str_to_title(param_value_type_fk),
    
    # Create interpretable range variables
    range = case_when(
      !is.na(param_bound_lower) & !is.na(param_bound_upper) ~
        paste(param_bound_lower, "-", param_bound_upper),
      TRUE ~ NA_character_
    ),
    
    # Consolidate uncertainty information
    uncert_bounds = case_when(
      param_uncert_type_fk == "Standard Deviation" ~ 
        as.character(param_uncert_single_val),
      !is.na(param_uncert_lower_val) & !is.na(param_uncert_upper_val) ~ 
        paste(param_uncert_lower_val, "-", param_uncert_upper_val),
      TRUE ~ NA_character_
    ),
    
    # Create readable age ranges
    pop_age_range = case_when(
      !is.na(pop_age_min) & !is.na(pop_age_max) ~
        paste(pop_age_min, "-", pop_age_max),
      !is.na(pop_age_min) ~ paste(pop_age_min, "+"),
      TRUE ~ "All ages"
    ),
    
    # Standardize uncertainty interval naming
    param_uncert_type_fk = case_when(
      param_uncert_type_fk == "CRI95%" ~ "95% CrI",  # Credible Interval
      param_uncert_type_fk == "CI95%" ~ "95% CI",    # Confidence Interval
      TRUE ~ param_uncert_type_fk
    )
  ) 

# Reshape data to have uncertainty types as columns
# Why: This creates a more readable table format
mpox_pivot <- mpox_clean %>%
  pivot_wider(
    names_from = param_uncert_type_fk,
    values_from = uncert_bounds
  )

cat("✓ Data cleaning completed\n")


# PART 5: CREATE PUBLICATION-READY SUMMARY TABLE ----------------------------
cat("\nPART 5: Creating the Final Summary Table\n")
cat("=========================================\n")

##-- Step 6: Format for presentation --##
# Why: A well-formatted table communicates findings clearly to stakeholders
result <- mpox_pivot %>%
  select(
    `Article Label` = article_label,      
    `Article Title` = article_title,      
    `Country` = pop_country,
    `Sample Size` = pop_sample_size,
    `Sex` = pop_sex_fk,
    `Age Range` = pop_age_range,
    `Parameter Type` = param_value_type_fk,
    `Value (days)` = param_val,
    `Standard Deviation`,
    `95% CrI`,
    `95% CI`,
    `IQR`,
    `Range` = range,
    `Distribution` = distribution_type_fk
  ) %>% 
  arrange(`Article Label`) %>%
  # Remove columns that are entirely NA
  select(where(~!all(is.na(.))))

cat("→ Final summary table:\n\n")

# Display the results
pander::pander(result, caption = "Mpox Incubation Period Parameters from grEPI")

# Summary statistics
cat("\nSUMMARY:\n")
cat("- Total studies included:", nrow(result), "\n")
cat("- Countries represented:", length(unique(result$Country[!is.na(result$Country)])), "\n")
cat("- Mean incubation period:", round(mean(result$`Value (days)`, na.rm = TRUE), 1), "days\n")
cat("- Range of values:", round(min(result$`Value (days)`, na.rm = TRUE), 1), "-", 
    round(max(result$`Value (days)`, na.rm = TRUE), 1), "days\n\n")


# PART 6: NEXT STEPS AND EXERCISES -------------------------------------------
cat("PART 6: Learning Extensions\n")
cat("===========================\n")
cat("TRY THESE EXERCISES:\n")
cat("1. Modify the script to extract serial interval parameters instead\n")
cat("2. Filter for a specific country or age group\n")

cat("TROUBLESHOOTING TIPS:\n")
cat("- If API fails: Check internet connection and try again\n")
cat("- If no data returned: Verify filter criteria match available values\n")
cat("- For other pathogens: Replace 'MPOX_PARAMETERS' with desired endpoint\n\n")

# Optional: Save results
# write_csv(result, "mpox_incubation_parameters.csv")
# cat("Results saved to 'mpox_incubation_parameters.csv'\n")

cat("Script completed successfully\n")
cat("Check the generated table above for your mpox incubation period summary.\n")

