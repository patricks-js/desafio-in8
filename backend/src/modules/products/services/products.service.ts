import { Injectable } from "@nestjs/common";
import { BrazilianProvidersService } from "../../providers/services/brazilian-providers.service";
import { EuropeanProvidersService } from "../../providers/services/european-providers.service";
import { ProductFiltersDTO } from "../dtos/product-filters.dto";

@Injectable()
export class ProductsService {
  private readonly limit = 10;
  private readonly offset = 0;

  constructor(
    private readonly brazilianProvidersService: BrazilianProvidersService,
    private readonly europeanProvidersService: EuropeanProvidersService,
  ) {}

  async getProducts() {
    const [brazilianProducts, europeanProducts] = await Promise.all([
      this.brazilianProvidersService.getProducts(),
      this.europeanProvidersService.getProducts(),
    ]);

    const products = [...brazilianProducts, ...europeanProducts];

    return products;
  }

  async getProductById(id: string) {
    const provider = id.split("_")[1];
    const productId = id.split("_")[2];

    if (provider === "br") {
      return this.brazilianProvidersService.getProductById(productId);
    }

    return this.europeanProvidersService.getProductById(productId);
  }

  async getProductsByIds(ids: string[]) {
    const products = await this.getProducts();

    return products.filter((product) => ids.includes(product.id));
  }

  async getFilteredProducts(
    filters: ProductFiltersDTO,
    limit = 10,
    offset = 0,
  ) {
    const products = await this.getProducts();

    const cleanArray = (arr?: string[]) =>
      arr?.filter((v) => typeof v === "string" && v.trim() !== "") ?? undefined;

    const q = filters.q?.trim() ?? "";
    const categories = cleanArray(filters.categories);
    const departments = cleanArray(filters.departments);
    const materials = cleanArray(filters.materials);

    const minPrice = Number.isNaN(Number(filters.minPrice))
      ? undefined
      : Number(filters.minPrice);
    const maxPrice = Number.isNaN(Number(filters.maxPrice))
      ? undefined
      : Number(filters.maxPrice);

    const filtered = products.filter((product) => {
      const matchQuery =
        !q || product.name.toLowerCase().includes(q.toLowerCase());
      const matchCategory =
        !categories || categories.includes(product.category);
      const matchDepartment =
        !departments || departments.includes(product.department);
      const matchMaterial = !materials || materials.includes(product.material);
      const matchMinPrice = minPrice === undefined || product.price >= minPrice;
      const matchMaxPrice = maxPrice === undefined || product.price <= maxPrice;

      return (
        matchQuery &&
        matchCategory &&
        matchDepartment &&
        matchMaterial &&
        matchMinPrice &&
        matchMaxPrice
      );
    });

    const hasNextPage = offset + limit < filtered.length;

    return {
      data: filtered.slice(offset, limit + offset),
      total: filtered.length,
      nextPage: hasNextPage ? offset + limit : null,
      hasNextPage,
      limit,
    };
  }
}
